// UNTESTED on a device (compiled in the debug build only)
// What the two home-screen widgets show, worked out from the saved day (phoneData v1) and the time now. The same rules as the
// iPhone widgets (ios-wrapper/native/HomeWidgets/StudyboardHomeWidgets.swift, SBWModel): after midnight, before the app has opened,
// today's list comes from the week ahead; Do This Next follows the plan's blocks through the day without the app running.
package com.studyboardapp.studyboard.widgets

import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

data class WTask(val id: String, val title: String, val course: String, val color: String, val meta: String,
                 val done: Boolean, val late: Boolean, val due: String, val time: String, val exam: Boolean)

data class WNext(val id: String, val title: String, val course: String, val color: String, val why: String)

/** The exam or deadline a countdown shows. days: whole days from today (0 = today). ready: readiness 0..100 when known. */
data class WCountdown(val id: String, val title: String, val course: String, val color: String, val days: Int, val ready: Int?,
                      val exam: Boolean, val due: String)

/** state: "spare", "tight" or "short" (src/js Time Cushion, phoneData().cushion). */
data class WCushion(val text: String, val state: String)

data class TodayModel(
    val setup: Boolean,
    val dateLabel: String,
    val exam: WCountdown?,
    val next: WNext?,
    val tasks: List<WTask>,
    val more: Int,
    val empty: String,
    val cushion: WCushion?,
    val accent: String
)

data class CountdownModel(val setup: Boolean, val item: WCountdown?, val accent: String)

object HomeWidgetModel {
    const val SETUP_TEXT = "Open Studyboard to see your day"
    private val HEX = Regex("^#[0-9A-Fa-f]{6}$")
    private val DAY = Regex("^\\d{4}-\\d{2}-\\d{2}$")

    fun dayKey(ms: Long, tz: TimeZone = TimeZone.getDefault()): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = tz }.format(ms)

    /** Whole days from a to b (yyyy-MM-dd), or null. */
    fun daysBetween(a: String, b: String, tz: TimeZone = TimeZone.getDefault()): Int? {
        if (!DAY.matches(a) || !DAY.matches(b)) return null
        fun cal(s: String): Calendar? = try {
            val p = s.split("-").map { it.toInt() }
            Calendar.getInstance(tz).apply { clear(); set(p[0], p[1] - 1, p[2], 12, 0, 0) }
        } catch (e: Exception) { null }
        val x = cal(a) ?: return null
        val y = cal(b) ?: return null
        return Math.round((y.timeInMillis - x.timeInMillis) / 86_400_000.0).toInt()
    }

    fun hex(s: String?, fallback: String): String = if (s != null && HEX.matches(s)) s.uppercase() else fallback

    /** "2h 30m", "45m" */
    fun mins(m: Int): String = if (m >= 60) (if (m % 60 == 0) "${m / 60}h" else "${m / 60}h ${m % 60}m") else "${m}m"

    private fun weekday(day: String, tz: TimeZone): String = try {
        val p = day.split("-").map { it.toInt() }
        val c = Calendar.getInstance(tz).apply { clear(); set(p[0], p[1] - 1, p[2], 12, 0, 0) }
        SimpleDateFormat("EEE", Locale.getDefault()).apply { timeZone = tz }.format(c.time)
    } catch (e: Exception) { day }

    /** "Due 5:00 PM", "Due tomorrow", "Due Thu", "Overdue" */
    fun dueLine(due: String, time: String, today: String, clockOf: (String) -> String, tz: TimeZone): String {
        if (due.isEmpty()) return ""
        val t = if (time.isNotEmpty()) clockOf(time) else ""
        if (due < today) return "Overdue"
        if (due == today) return if (t.isNotEmpty()) "Due $t" else "Due today"
        if (daysBetween(today, due, tz) == 1) return if (t.isNotEmpty()) "Due tomorrow $t" else "Due tomorrow"
        return "Due " + weekday(due, tz)
    }

    /** The Time Cushion line, when the page sent one (another part of the app adds it; absent means nothing to show). */
    fun cushion(o: JSONObject?, today: String, tz: TimeZone): WCushion? {
        if (o == null || !o.has("mins")) return null
        val state = o.optString("state")
        if (state !in setOf("spare", "tight", "short")) return null
        val m = Math.abs(o.optInt("mins", 0))
        val by = o.optString("by")
        val byTxt = if (DAY.matches(by) && by >= today) (if (by == today) " today" else if (daysBetween(today, by, tz) == 1) " by tomorrow" else " by " + weekday(by, tz)) else ""
        val text = when (state) {
            "spare" -> "${mins(m)} to spare"
            "tight" -> "Tight: ${mins(m)} spare$byTxt"
            else -> "${mins(m)} short$byTxt"
        }
        return WCushion(text, state)
    }

    private fun str(o: JSONObject?, k: String): String = if (o == null || o.isNull(k)) "" else o.optString(k, "")

    private fun tasksOf(d: JSONObject, today: String, fresh: Boolean, clockOf: (String) -> String, tz: TimeZone): List<WTask> {
        val out = ArrayList<WTask>()
        if (fresh) {
            val a = d.optJSONArray("tasks") ?: JSONArray()
            for (i in 0 until a.length()) {
                val t = a.optJSONObject(i) ?: continue
                out.add(WTask(str(t, "id"), str(t, "title"), str(t, "course"), hex(str(t, "color"), "#8A94A6"), str(t, "meta"),
                    t.optBoolean("done"), t.optBoolean("late"), str(t, "due"), str(t, "time"), t.optBoolean("exam")))
            }
            return out
        }
        // after midnight: today's items from the week ahead, until the app saves the new day
        val day = weekDay(d, today) ?: return out
        val items = day.optJSONArray("items") ?: JSONArray()
        for (i in 0 until items.length()) {
            val t = items.optJSONObject(i) ?: continue
            out.add(WTask(str(t, "id"), str(t, "title"), str(t, "course"), hex(str(t, "color"), "#8A94A6"),
                dueLine(today, str(t, "time"), today, clockOf, tz), false, false, today, str(t, "time"), t.optBoolean("exam")))
        }
        return out
    }

    private fun weekDay(d: JSONObject, today: String): JSONObject? {
        val days = d.optJSONArray("days") ?: return null
        for (i in 0 until days.length()) { val x = days.optJSONObject(i); if (x != null && str(x, "date") == today) return x }
        return null
    }

    /** The exam in Exam Mode (phoneData().exam), counted from today; null once it's past. */
    private fun examOf(d: JSONObject, today: String, tz: TimeZone): WCountdown? {
        val e = d.optJSONObject("exam") ?: return null
        val due = str(e, "due")
        if (due.isEmpty() || due < today) return null
        val days = daysBetween(today, due, tz) ?: return null
        val ready = if (e.has("ready") && !e.isNull("ready")) e.optInt("ready").coerceIn(0, 100) else null
        return WCountdown(str(e, "id"), str(e, "title"), str(e, "course"), hex(str(e, "color"), "#8A94A6"), days, ready, true, due)
    }

    fun today(d: JSONObject?, now: Long, clock: (Long) -> String, clockOf: (String) -> String, tz: TimeZone = TimeZone.getDefault()): TodayModel {
        if (d == null) return TodayModel(true, "", null, null, emptyList(), 0, SETUP_TEXT, null, "#2C55D6")
        val today = dayKey(now, tz)
        val fresh = str(d, "day") == today
        val tasks = tasksOf(d, today, fresh, clockOf, tz)
        val open = tasks.filter { !it.done }
        val openIds = open.map { it.id }.toSet()
        // the block of today's plan on now (or, in a gap, the next one)
        var next: WNext? = null
        if (fresh) {
            val plan = d.optJSONArray("plan") ?: JSONArray()
            val left = ArrayList<JSONObject>()
            for (i in 0 until plan.length()) {
                val s = plan.optJSONObject(i) ?: continue
                if (str(s, "id") in openIds && s.optLong("to") > now) left.add(s)
            }
            left.sortBy { it.optLong("from") }
            val s = left.firstOrNull { it.optLong("from") <= now } ?: left.firstOrNull()
            if (s != null) {
                val why = if (s.optLong("from") <= now) "Until " + clock(s.optLong("to")) else clock(s.optLong("from")) + " to " + clock(s.optLong("to"))
                next = WNext(str(s, "id"), str(s, "title"), str(s, "course"), hex(str(s, "color"), "#8A94A6"), why)
            }
            if (next == null) {
                val n = d.optJSONObject("next")
                if (n != null && str(n, "id") in openIds) {
                    val m = n.optInt("mins", 0)
                    val why = listOf(str(n, "why"), if (m > 0) mins(m) else "").filter { it.isNotEmpty() }.joinToString(" · ")
                    next = WNext(str(n, "id"), str(n, "title"), str(n, "course"), hex(str(n, "color"), "#8A94A6"), why)
                }
            }
        }
        if (next == null) open.firstOrNull()?.let { next = WNext(it.id, it.title, it.course, it.color, it.meta) }
        val dayOff = if (fresh) d.optBoolean("dayOff") else (weekDay(d, today)?.optBoolean("off") == true)
        val empty = when {
            open.isEmpty() && tasks.isNotEmpty() -> "All done for today"
            open.isEmpty() && dayOff -> "Day off. Enjoy it."
            open.isEmpty() -> "Nothing planned today"
            else -> ""
        }
        // the list under Do This Next: everything else on today's list, open tasks first
        val rest = tasks.filter { it.id != next?.id }.sortedBy { if (it.done) 1 else 0 }
        val more = if (fresh) d.optInt("more", 0).coerceAtLeast(0) else 0
        return TodayModel(false, if (fresh) str(d, "dateLabel") else "", examOf(d, today, tz), next, rest, more, empty,
            cushion(d.optJSONObject("cushion"), today, tz), hex(d.optJSONObject("theme")?.let { str(it, "accent") }, "#2C55D6"))
    }

    fun countdown(d: JSONObject?, now: Long, tz: TimeZone = TimeZone.getDefault()): CountdownModel {
        if (d == null) return CountdownModel(true, null, "#2C55D6")
        val today = dayKey(now, tz)
        val accent = hex(d.optJSONObject("theme")?.let { str(it, "accent") }, "#2C55D6")
        examOf(d, today, tz)?.let { return CountdownModel(false, it, accent) }
        // otherwise the next exam on the list or in the week ahead, then the next deadline of any kind
        val cands = ArrayList<WCountdown>()
        if (str(d, "day") == today) {
            val a = d.optJSONArray("tasks") ?: JSONArray()
            for (i in 0 until a.length()) {
                val t = a.optJSONObject(i) ?: continue
                val due = str(t, "due")
                if (t.optBoolean("done") || due < today || due.isEmpty()) continue
                cands.add(WCountdown(str(t, "id"), str(t, "title"), str(t, "course"), hex(str(t, "color"), "#8A94A6"), daysBetween(today, due, tz) ?: continue, null, t.optBoolean("exam"), due))
            }
        }
        val days = d.optJSONArray("days") ?: JSONArray()
        for (i in 0 until days.length()) {
            val day = days.optJSONObject(i) ?: continue
            val date = str(day, "date")
            if (date < today) continue
            val items = day.optJSONArray("items") ?: continue
            for (j in 0 until items.length()) {
                val t = items.optJSONObject(j) ?: continue
                cands.add(WCountdown(str(t, "id"), str(t, "title"), str(t, "course"), hex(str(t, "color"), "#8A94A6"), daysBetween(today, date, tz) ?: continue, null, t.optBoolean("exam"), date))
            }
        }
        val pick = cands.filter { it.exam }.minByOrNull { it.days } ?: cands.minByOrNull { it.days }
        return CountdownModel(false, pick, accent)
    }
}
