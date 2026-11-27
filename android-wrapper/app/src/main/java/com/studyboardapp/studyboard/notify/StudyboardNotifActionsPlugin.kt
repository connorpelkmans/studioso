// UNTESTED on a device (compiled in the debug build only)
// The page's side of the reminder buttons (window.StudyboardNative.notifActions in native-bridge.js section 13). The same JS name and
// methods as the iPhone plugin (ios-wrapper/native/Notifications/StudyboardNotifActions.swift):
//   drain()      {items: [{id, kind: "done"|"snooze", task, rid, at, until?, server}]}: presses on reminders, oldest first
//   ack({ids})   those are done in the page
package com.studyboardapp.studyboard.notify

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "StudyboardNotifActions")
class StudyboardNotifActionsPlugin : Plugin() {
    @PluginMethod
    fun drain(call: PluginCall) {
        val all = ReminderNotifications.items(context)
        val arr = JSArray()
        for (i in 0 until minOf(all.length(), 100)) all.optJSONObject(i)?.let { arr.put(JSObject(it.toString())) }
        call.resolve(JSObject().put("items", arr))
    }

    @PluginMethod
    fun ack(call: PluginCall) {
        val ids = call.getArray("ids")
        val list = ArrayList<String>()
        if (ids != null) for (i in 0 until ids.length()) ids.optString(i)?.let { if (it.isNotEmpty()) list.add(it) }
        ReminderNotifications.remove(context, list)
        call.resolve()
    }
}
