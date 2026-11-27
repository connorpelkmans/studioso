// UNTESTED on a device (compiled in the debug build only; no emulator here)
// The day the home-screen widgets show (what src/js/70-widgets.js phoneData() sends, JSON v1, the same as the iPhone widgets) and the
// tasks ticked off on a widget, waiting for the app to do them for real (StudyboardNative.homeWidgets.drain/ack in the page).
// Kept in private SharedPreferences: nothing here is readable by other apps, and none of it is backed up (data_extraction_rules.xml).
package com.studyboardapp.studyboard.widgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

object HomeWidgetStore {
    private const val PREFS = "sb_home_widgets"
    private const val K_DAY = "day"
    private const val K_ACTIONS = "actions"
    private const val MAX_JSON = 400_000
    private const val MAX_ACTIONS = 100
    private val TASK_ID = Regex("^[A-Za-z0-9_:.-]{1,80}$")
    private val lock = Any()

    private fun prefs(ctx: Context) = ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** The saved day, or null when nothing (or nothing valid) is saved: the widgets then say "Open Studyboard to see your day". */
    fun load(ctx: Context): JSONObject? {
        val raw = prefs(ctx).getString(K_DAY, null) ?: return null
        return parse(raw)
    }

    /** Only a day that parses as v1 is kept, so a bad write can't leave the widgets blank. */
    fun save(ctx: Context, raw: String): Boolean {
        if (raw.length > MAX_JSON || parse(raw) == null) return false
        synchronized(lock) { prefs(ctx).edit().putString(K_DAY, raw).apply() }
        return true
    }

    /** Signing out: nothing of the student's stays on the home screen. */
    fun clear(ctx: Context) {
        synchronized(lock) { prefs(ctx).edit().clear().apply() }
    }

    fun parse(raw: String): JSONObject? = try {
        val o = JSONObject(raw)
        if (o.optInt("v", 0) == 1 && o.optJSONArray("tasks") != null) o else null
    } catch (e: Exception) { null }

    /** Ticks waiting for the page, oldest first: [{id, kind: "done", task, at}]. */
    fun actions(ctx: Context): JSONArray = synchronized(lock) {
        try { JSONArray(prefs(ctx).getString(K_ACTIONS, "[]")) } catch (e: Exception) { JSONArray() }
    }

    fun removeActions(ctx: Context, ids: Collection<String>) {
        if (ids.isEmpty()) return
        synchronized(lock) {
            val drop = ids.toSet()
            val now = actions(ctx)
            val next = JSONArray()
            for (i in 0 until now.length()) {
                val a = now.optJSONObject(i) ?: continue
                if (a.optString("id") !in drop) next.put(a)
            }
            prefs(ctx).edit().putString(K_ACTIONS, next.toString()).apply()
        }
    }

    /** A tick on the widget: it shows as done straight away (the saved day is changed here) and waits in the queue until the app
     *  does it and syncs it. A second tick on the same task is not queued twice. */
    fun checkOff(ctx: Context, taskId: String, now: Long = System.currentTimeMillis()): Boolean {
        if (!TASK_ID.matches(taskId)) return false
        synchronized(lock) {
            val list = actions(ctx)
            var queued = false
            for (i in 0 until list.length()) {
                val a = list.optJSONObject(i) ?: continue
                if (a.optString("task") == taskId && a.optString("kind") == "done") queued = true
            }
            if (!queued) {
                list.put(JSONObject().put("id", UUID.randomUUID().toString()).put("kind", "done").put("task", taskId).put("at", now))
                while (list.length() > MAX_ACTIONS) list.remove(0)
            }
            val ed = prefs(ctx).edit().putString(K_ACTIONS, list.toString())
            val day = load(ctx)
            if (day != null) {
                var changed = false
                val tasks = day.optJSONArray("tasks") ?: JSONArray()
                for (i in 0 until tasks.length()) {
                    val t = tasks.optJSONObject(i) ?: continue
                    if (t.optString("id") == taskId && !t.optBoolean("done")) { t.put("done", true).put("late", false); changed = true }
                }
                val next = day.optJSONObject("next")
                if (next != null && next.optString("id") == taskId) {
                    // the next open task takes its place until the app works out the plan again
                    var repl: JSONObject? = null
                    for (i in 0 until tasks.length()) {
                        val t = tasks.optJSONObject(i) ?: continue
                        if (!t.optBoolean("done")) { repl = JSONObject().put("id", t.optString("id")).put("title", t.optString("title"))
                            .put("course", t.optString("course")).put("color", t.optString("color")).put("due", t.optString("due")).put("time", t.optString("time")); break }
                    }
                    if (repl != null) day.put("next", repl) else day.remove("next")
                    changed = true
                }
                if (changed) ed.putString(K_DAY, day.toString())
            }
            ed.apply()
        }
        return true
    }
}
