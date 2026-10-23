// UNTESTED: written without a compiler, emulator or device
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
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.security.MessageDigest
import java.security.SecureRandom

private val IDS = setOf("brightspace", "canvas", "blackboard")

private fun originOf(url: String?): String {
    val u = try { Uri.parse(url ?: "") } catch (e: Exception) { return "" }
    if (u.scheme != "https" || u.host.isNullOrEmpty()) return ""
    val port = if (u.port != -1 && u.port != 443) ":" + u.port else ""
    return "https://" + u.host!!.lowercase() + port
}

private fun token(): String { val b = ByteArray(16); SecureRandom().nextBytes(b); return b.joinToString("") { "%02x".format(it) } }

// One allowed script (the list is LMS_SCRIPTS in StudyboardLmsScripts.kt)
internal class LmsScript(val id: String, val use: String, val lens: IntArray, val hashes: Array<String>, val holes: Array<String>)

private fun sha256Hex(b: ByteArray, from: Int, len: Int): String {
    val md = MessageDigest.getInstance("SHA-256"); md.update(b, from, len)
    return md.digest().joinToString("") { "%02x".format(it) }
}

// A JSON value from the page, written out again by org.json
private fun jsonData(text: String): Any? = try {
    val t = JSONTokener(text); val v = t.nextValue()
    if (t.nextClean() != '\u0000') null else v
} catch (e: Exception) { null }

private fun jsonText(v: Any?): String? = try {
    when (v) {
        is JSONObject -> v.toString()
        is JSONArray -> v.toString()
        is String -> JSONObject.quote(v)
        is Boolean, is Int, is Long -> v.toString()
        is Number -> if (v.toDouble().isFinite()) v.toString() else null
        JSONObject.NULL -> "null"
        else -> null
    }
} catch (e: Exception) { null }

private fun fillScript(t: LmsScript, b: ByteArray, origin: String): String? {
    val out = StringBuilder(); var pos = 0; val last = t.lens.size - 1
    for (i in 0..last) {
        val len = t.lens[i]
        if (pos + len > b.size || sha256Hex(b, pos, len) != t.hashes[i]) return null
        out.append(String(b, pos, len, Charsets.UTF_8)); pos += len
        if (i == last) return if (pos == b.size) out.toString() else null
        when (t.holes[i]) {
            "digits" -> {
                var j = pos
                while (j < b.size && j - pos < 14 && b[j].toInt() in 48..57) j++
                if (j == pos) return null
                out.append(String(b, pos, j - pos, Charsets.UTF_8)); pos = j
            }
            "json", "url" -> {
                val end = b.size - t.lens[last]
                if (i + 1 != last || end < pos) return null
                val v = jsonData(String(b, pos, end - pos, Charsets.UTF_8))
                if (t.holes[i] == "url" && !(v is String && v.length <= 4000 && v.startsWith("$origin/"))) return null
                out.append(jsonText(v) ?: return null); pos = end
            }
            else -> return null
        }
    }
    return null
}

// The script to run (with its holes checked and refilled here)
private fun allowedScript(id: String, use: String, script: String, origin: String): String? {
    val b = script.toByteArray(Charsets.UTF_8)
    for (t in LMS_SCRIPTS) if (t.id == id && t.use == use) fillScript(t, b, origin)?.let { return it }
    return null
}

// Receives the one answer of one script run
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
    s.userAgentString = s.userAgentString.replace("; wv", "").replace(Regex("Version/\\d+\\.\\d+ "), "")
    CookieManager.getInstance().setAcceptCookie(true)
    CookieManager.getInstance().setAcceptThirdPartyCookies(wv, true)
    wv.webChromeClient = WebChromeClient()
}

private fun guardClient(onFinish: (WebView) -> Unit, onError: () -> Unit) = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = request.url.scheme != "https"
    override fun onPageFinished(view: WebView, url: String?) { onFinish(view) }
    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: android.webkit.WebResourceError) { if (request.isForMainFrame) onError() }
}

// `expr` is an expression that may return a promise
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
        val given = call.getString("who")
        val who = if (given == null || given.length > 4000) null else allowedScript(r.id, "who", given, r.origin)
        if (who == null) { call.reject("bad-request"); return }
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
                if (finished || originOf(wv.url) != r.origin) return
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
        val given = call.getString("script")
        if (given == null || given.length > 400_000) { call.reject("bad-request"); return }
        val script = allowedScript(r.id, "run", given, r.origin)
        if (script == null) { call.reject("script-not-allowed"); return }
        val ms = ((call.getDouble("timeoutMs") ?: 60000.0).coerceIn(5000.0, 180000.0)).toLong()
        activity.runOnUiThread {
            val host = activity.findViewById<FrameLayout>(android.R.id.content)
            val wv = WebView(activity); configure(wv)
            wv.alpha = 0.01f; wv.isEnabled = false
            host.addView(wv, 0, FrameLayout.LayoutParams(360, 640))
            var done = false
            val finish = { res: JSObject ->
                if (!done) { done = true; wv.removeJavascriptInterface("SBLmsNative"); wv.stopLoading(); host.removeView(wv); wv.destroy(); CookieManager.getInstance().flush(); call.resolve(res) }
            }
            main.postDelayed({ finish(JSObject().put("error", "timeout")) }, ms)
            var ran = false
            val go = {
                if (!done && !ran) {
                    ran = true
                    if (originOf(wv.url) != r.origin) finish(JSObject().put("needLogin", true))
                    else evalAsync(wv, script, Sink(token()) { json -> finish(JSObject().put("ok", true).put("json", json)) })
                }
            }
            wv.webViewClient = guardClient({ go() }, { go() })
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
