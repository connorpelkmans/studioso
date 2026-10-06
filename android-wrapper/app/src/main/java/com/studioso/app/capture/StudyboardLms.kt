// UNTESTED: written without a compiler, emulator or device. Capacitor Android local plugin `StudyboardLms` (@CapacitorPlugin / @PluginMethod, Capacitor 5-8).
// The native half of the phone apps' school site sync; the web half is lms-mobile.js (built from lms-mobile.src.js and lms.js by scripts/build-lms-mobile.js).
//
//   connect({id, origin, url, who})              -> {ok: true, name} | {ok: false, cancelled: true}
//        A full-screen sign-in page on the school's own site (single sign-on and MFA included), with its address always shown. Done when the script
//        `who` (run inside that page) returns a person. Studyboard never sees the password.
//   run({id, origin, url, script, timeoutMs})   -> {ok: true, json} | {needLogin: true} | {error}
//        Loads `url` in a hidden WebView that shares the app's sign-in cookies, checks it is still on `origin` (if not, you are signed out), runs `script`
//        there (it may return a promise) and gives back its result as JSON text.
//   signOut({id, origin})                         -> {}
//        Forgets the sign-in cookies for that school's site.
//
// Safety rules (mirror lms.js): https only; no camera, microphone or location; the result channel is a per-run secret token that is removed when the run ends.
// Android has one cookie jar per app, so platforms are separated by site, not by store. Register in MainActivity BEFORE super.onCreate (README-ANDROID.md):
//   registerPlugin(StudyboardLmsPlugin::class.java)
package com.studioso.app.capture

import android.annotation.SuppressLint
import android.app.Dialog
import android.graphics.Color
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.security.SecureRandom

private val IDS = setOf("brightspace", "canvas", "blackboard")

private fun originOf(url: String?): String {
    val u = try { Uri.parse(url ?: "") } catch (e: Exception) { return "" }
    if (u.scheme != "https" || u.host.isNullOrEmpty()) return ""
    val port = if (u.port != -1 && u.port != 443) ":" + u.port else ""
    return "https://" + u.host!!.lowercase() + port
}

private fun token(): String { val b = ByteArray(16); SecureRandom().nextBytes(b); return b.joinToString("") { "%02x".format(it) } }

// Receives the one answer of one script run. The page can only reach it if it knows the secret token, and it is removed when the run ends.
private class Sink(val token: String, val onResult: (String) -> Unit) {
    @JavascriptInterface fun done(t: String?, json: String?) { if (t == token && json != null && json.length < 40_000_000) Handler(Looper.getMainLooper()).post { onResult(json) } }
}

@SuppressLint("SetJavaScriptEnabled", "AddJavascriptInterface")
private fun configure(wv: WebView) {
    val s = wv.settings
    s.javaScriptEnabled = true; s.domStorageEnabled = true
    s.allowFileAccess = false; s.allowContentAccess = false
    s.setSupportMultipleWindows(false); s.javaScriptCanOpenWindowsAutomatically = false
    s.mediaPlaybackRequiresUserGesture = true
    s.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
    s.userAgentString = s.userAgentString.replace("; wv", "").replace(Regex("Version/\\d+\\.\\d+ "), "")    // some sign-in pages turn away a bare WebView
    CookieManager.getInstance().setAcceptCookie(true)
    CookieManager.getInstance().setAcceptThirdPartyCookies(wv, true)         // single sign-on providers set their cookies from another site
    wv.webChromeClient = WebChromeClient()                                    // the default denies camera, microphone and location requests
}

private fun guardClient(onFinish: (WebView) -> Unit, onError: () -> Unit) = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.url.scheme != "https"   // never http, intent: or custom schemes
    override fun onPageFinished(view: WebView, url: String?) { onFinish(view) }
    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: android.webkit.WebResourceError) { if (request.isForMainFrame) onError() }
}

// `expr` is an expression that may return a promise; the answer goes to the Sink with the secret token.
private fun evalAsync(wv: WebView, expr: String, sink: Sink) {
    wv.removeJavascriptInterface("SBLmsNative")
    wv.addJavascriptInterface(sink, "SBLmsNative")
    val js = "(async () => { let out; try { out = await ($expr); } catch (e) { out = {error: String((e && e.message) || e).slice(0, 200)}; } " +
        "SBLmsNative.done(${JSONObject.quote(sink.token)}, JSON.stringify(out === undefined ? null : out)); })()"
    wv.evaluateJavascript(js, null)
}

@CapacitorPlugin(name = "StudyboardLms")
class StudyboardLmsPlugin : Plugin() {
    private val main = Handler(Looper.getMainLooper())

    private data class Req(val id: String, val origin: String, val url: String)
    private fun checked(call: PluginCall): Req? {
        val id = call.getString("id"); val o = call.getString("origin"); val u = call.getString("url")
        if (id == null || id !in IDS || o == null || originOf(o) != o || originOf(u) != o || u == null) { call.reject("bad-request"); return null }
        return Req(id, o, u)
    }

    @PluginMethod
    fun connect(call: PluginCall) {
        val r = checked(call) ?: return
        val who = call.getString("who")
        if (who == null || who.length > 4000) { call.reject("bad-request"); return }
        activity.runOnUiThread {
            val dialog = Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
            val wv = WebView(activity); configure(wv)
            var finished = false
            val finish = { res: JSObject ->
                if (!finished) { finished = true; wv.removeJavascriptInterface("SBLmsNative"); wv.stopLoading(); dialog.dismiss(); wv.destroy(); CookieManager.getInstance().flush(); call.resolve(res) }
            }
            val hostLabel = TextView(activity).apply { setTextColor(Color.LTGRAY); textSize = 13f; maxLines = 1; gravity = Gravity.CENTER_VERTICAL; setPadding(24, 0, 24, 0) }
            val cancel = Button(activity).apply { text = "Cancel"; setOnClickListener { finish(JSObject().put("ok", false).put("cancelled", true)) } }
            val bar = LinearLayout(activity).apply { orientation = LinearLayout.HORIZONTAL; setBackgroundColor(Color.DKGRAY); addView(cancel); addView(hostLabel, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)) }
            val root = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; addView(bar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 140)); addView(wv, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)) }
            fun check() {
                if (finished || originOf(wv.url) != r.origin) return          // only when the school's own page is on screen
                evalAsync(wv, who, Sink(token()) { json ->
                    val o = try { JSONObject(json) } catch (e: Exception) { null }
                    if (!finished && o != null) finish(JSObject().put("ok", true).put("name", o.optString("name", "")))
                })
            }
            wv.webViewClient = guardClient({ v -> hostLabel.text = Uri.parse(v.url ?: "").host ?: ""; check() }, { })
            val poll = object : Runnable { override fun run() { if (!finished) { hostLabel.text = Uri.parse(wv.url ?: "").host ?: ""; check(); main.postDelayed(this, 2500) } } }
            dialog.setContentView(root); dialog.setOnCancelListener { finish(JSObject().put("ok", false).put("cancelled", true)) }
            dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
            dialog.show(); wv.loadUrl(r.url); main.postDelayed(poll, 2500)
        }
    }

    @PluginMethod
    fun run(call: PluginCall) {
        val r = checked(call) ?: return
        val script = call.getString("script")
        if (script == null || script.length > 400_000) { call.reject("bad-request"); return }
        val ms = ((call.getDouble("timeoutMs") ?: 60000.0).coerceIn(5000.0, 180000.0)).toLong()
        activity.runOnUiThread {
            val host = activity.findViewById<FrameLayout>(android.R.id.content)
            val wv = WebView(activity); configure(wv)
            wv.alpha = 0.01f; wv.isEnabled = false
            host.addView(wv, 0, FrameLayout.LayoutParams(360, 640))       // kept in the view tree (nearly invisible) so Android does not pause it
            var done = false
            val finish = { res: JSObject ->
                if (!done) { done = true; wv.removeJavascriptInterface("SBLmsNative"); wv.stopLoading(); host.removeView(wv); wv.destroy(); CookieManager.getInstance().flush(); call.resolve(res) }
            }
            main.postDelayed({ finish(JSObject().put("error", "timeout")) }, ms)
            var ran = false
            val go = {
                if (!done && !ran) {
                    ran = true
                    if (originOf(wv.url) != r.origin) finish(JSObject().put("needLogin", true))     // sent to a sign-in page (or elsewhere): not signed in
                    else evalAsync(wv, script, Sink(token()) { json -> finish(JSObject().put("ok", true).put("json", json)) })
                }
            }
            wv.webViewClient = guardClient({ go() }, { go() })      // a non-HTML page or a redirect can report an error; the origin check above decides
            wv.loadUrl(r.url)
        }
    }

    @PluginMethod
    fun signOut(call: PluginCall) {
        val id = call.getString("id")
        if (id == null || id !in IDS) { call.reject("bad-request"); return }
        val host = try { Uri.parse(call.getString("origin") ?: "").host ?: "" } catch (e: Exception) { "" }
        activity.runOnUiThread {
            val cm = CookieManager.getInstance()
            if (host.isNotEmpty()) {
                // Cookies are removed for the school's site and its parent domains (single sign-on cookies are often set on the parent)
                val parts = host.split(".")
                val domains = (0 until parts.size - 1).map { parts.drop(it).joinToString(".") }
                for (d in domains) {
                    val names = (cm.getCookie("https://$d") ?: "").split(";").map { it.substringBefore("=").trim() }.filter { it.isNotEmpty() }
                    for (n in names) for (dom in listOf(null, d, ".$d")) {
                        cm.setCookie("https://$d", "$n=; Max-Age=0; Path=/; Secure" + (if (dom != null) "; Domain=$dom" else ""))
                    }
                }
            }
            cm.flush()
            call.resolve()
        }
    }
}
