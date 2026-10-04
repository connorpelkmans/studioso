// UNTESTED: written without compiler access. Capacitor Android local plugins (Capacitor 5/6/7 annotation API: @CapacitorPlugin / @PluginMethod; verify).
//   StudyboardCaptureToken: save({token, endpoint}) / clear()        <- window.StudyboardNative.saveCaptureToken / clearCaptureToken (native-bridge.js)
//   StudyboardSharedQueue:  drain() -> {items:[...]} / ack({ids})    <- native-bridge.js, then SBCAPTURE.ingest(item)
// Register both in MainActivity BEFORE super.onCreate (see README-ANDROID.md).
package com.studioso.app.capture

import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "StudyboardCaptureToken")
class StudyboardCaptureTokenPlugin : Plugin() {
    @PluginMethod
    fun save(call: PluginCall) {
        val token = call.getString("token")
        val endpoint = call.getString("endpoint")
        if (token == null || endpoint == null || !CaptureStore.save(context, token, endpoint)) call.reject("invalid") else call.resolve()   // never log token
    }

    @PluginMethod
    fun clear(call: PluginCall) {
        CaptureStore.clear(context)
        call.resolve()
    }
}

@CapacitorPlugin(name = "StudyboardSharedQueue")
class StudyboardSharedQueuePlugin : Plugin() {
    @PluginMethod
    fun drain(call: PluginCall) {
        val arr = JSArray()
        for (j in CaptureQueue.items(context).take(50)) {
            val o = JSObject(j.toString())
            if (j.optBoolean("hasImage", false)) {
                CaptureQueue.image(context, j.optString("id"))?.let { o.put("image", "data:image/jpeg;base64," + Base64.encodeToString(it, Base64.NO_WRAP)) }
            }
            o.remove("hasImage")
            arr.put(o)
        }
        call.resolve(JSObject().put("items", arr))
    }

    @PluginMethod
    fun ack(call: PluginCall) {
        val ids = call.getArray("ids")
        if (ids != null) for (i in 0 until ids.length()) CaptureQueue.remove(context, ids.optString(i))
        call.resolve()
    }
}
