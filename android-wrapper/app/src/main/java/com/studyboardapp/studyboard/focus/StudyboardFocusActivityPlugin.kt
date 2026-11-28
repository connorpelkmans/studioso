// UNTESTED on a device (compiled in the debug build only)
// Android's StudyboardFocusActivity: the same JS name and methods the iPhone's Live Activity plugin has, so the page's Focus timer
// (src/js/01-focus.js islandSync / pomoTakeLock) drives the ongoing notification without Android-only page code.
//   available()  {value}: may Studyboard post notifications
//   show(state)  {mode, label, task, running, endsAt, left, total, accent} -> {shown: false}. Always false: on Android the timer stays in
//                the page's own header too (the notification is in the shade, not on screen like the Dynamic Island)
//   end()        the session is over: the notification goes
//   take()       {actions: [{a: "pause"|"play"|"reset", t, left?, end?}]}: presses on the notification, oldest first, each once
//   event "action": a press happened while the page is running
package com.studyboardapp.studyboard.focus

import android.Manifest
import android.os.Build
import androidx.core.app.ActivityCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "StudyboardFocusActivity")
class StudyboardFocusActivityPlugin : Plugin() {
    override fun load() {
        FocusNotification.onAction = { bridge?.executeOnMainThread { notifyListeners("action", JSObject()) } }
    }

    @PluginMethod
    fun available(call: PluginCall) {
        call.resolve(JSObject().put("value", FocusNotification.allowed(context)))
    }

    @PluginMethod
    fun show(call: PluginCall) {
        val mode = call.getString("mode", "focus") ?: "focus"
        val s = FocusNotification.State(
            mode = if (mode in setOf("focus", "short", "long")) mode else "focus",
            label = (call.getString("label", "") ?: "").take(24),
            task = (call.getString("task", "") ?: "").take(80),
            running = call.getBoolean("running", false) ?: false,
            endsAt = (call.getDouble("endsAt") ?: 0.0).toLong(),
            left = (call.getDouble("left") ?: 0.0).toInt().coerceAtLeast(0),
            total = (call.getDouble("total") ?: 1500.0).toInt().coerceAtLeast(1),
            accent = (call.getString("accent", "") ?: "").takeIf { Regex("^#[0-9A-Fa-f]{6}$").matches(it) } ?: ""
        )
        if (!FocusNotification.allowed(context)) askOnce()
        FocusNotification.post(context, s)
        call.resolve(JSObject().put("shown", false))
    }

    @PluginMethod
    fun end(call: PluginCall) {
        FocusNotification.cancel(context)
        call.resolve()
    }

    @PluginMethod
    fun take(call: PluginCall) {
        val q = FocusNotification.take(context)
        val arr = JSArray()
        for (i in 0 until q.length()) q.optJSONObject(i)?.let { arr.put(JSObject(it.toString())) }
        call.resolve(JSObject().put("actions", arr))
    }

    // Android 13+: the notification permission is asked for once, the first time a session starts without it
    private fun askOnce() {
        if (Build.VERSION.SDK_INT < 33) return
        val p = context.getSharedPreferences("sb_focus_note", 0)
        if (p.getBoolean("asked", false)) return
        p.edit().putBoolean("asked", true).apply()
        activity?.let { ActivityCompat.requestPermissions(it, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4202) }
    }
}
