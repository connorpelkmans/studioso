// UNTESTED on a device (compiled in the debug build only)
// The page's side of the home-screen widgets: the same JS name and methods as the iPhone plugin (ios-wrapper/native/HomeWidgets/
// StudyboardHomeWidgetsPlugin.swift), so native-bridge.js section 6b and src/js/70-widgets.js work unchanged on Android.
//   save({json})  the day (phoneData v1); the widgets are redrawn a moment later, once a burst of saves has settled
//   drain()       {items: [{id, kind: "done", task, at}]}: tasks ticked off on a widget, oldest first
//   ack({ids})    those are done in the page
//   clear()       signing out: nothing of the student's stays on the home screen
package com.studyboardapp.studyboard.widgets

import android.os.Handler
import android.os.Looper
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "StudyboardHomeWidgets")
class StudyboardHomeWidgetsPlugin : Plugin() {
    private val main = Handler(Looper.getMainLooper())
    private val redraw = Runnable { HomeWidgets.updateAll(context) }

    private fun redrawSoon() {
        main.removeCallbacks(redraw)
        main.postDelayed(redraw, 1500)
    }

    @PluginMethod
    fun save(call: PluginCall) {
        val json = call.getString("json")
        if (json == null || !HomeWidgetStore.save(context, json)) { call.reject("invalid"); return }
        redrawSoon()
        call.resolve()
    }

    @PluginMethod
    fun drain(call: PluginCall) {
        val all = HomeWidgetStore.actions(context)
        val arr = JSArray()
        for (i in 0 until minOf(all.length(), 100)) {
            val a = all.optJSONObject(i) ?: continue
            arr.put(JSObject().put("id", a.optString("id")).put("kind", a.optString("kind")).put("task", a.optString("task")).put("at", a.optLong("at")))
        }
        call.resolve(JSObject().put("items", arr))
    }

    @PluginMethod
    fun ack(call: PluginCall) {
        val ids = call.getArray("ids")
        val list = ArrayList<String>()
        if (ids != null) for (i in 0 until ids.length()) ids.optString(i)?.let { if (it.isNotEmpty()) list.add(it) }
        HomeWidgetStore.removeActions(context, list)
        call.resolve()
    }

    @PluginMethod
    fun clear(call: PluginCall) {
        HomeWidgetStore.clear(context)
        redrawSoon()
        call.resolve()
    }
}
