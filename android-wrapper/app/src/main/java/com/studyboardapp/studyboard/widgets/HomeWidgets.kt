// UNTESTED on a device (compiled in the debug build only; no emulator here)
// The two home-screen widgets: Today (Do This Next, today's tasks with a tick each, Exam Mode's countdown at the top and the Time
// Cushion line at the bottom) and Countdown (the next exam or big deadline). Both are drawn from the day the page saved
// (HomeWidgetStore), in the system's light or dark colours (res/values-night) with the theme accent the page sent.
// They move on without the app: an inexact, non-waking AlarmManager alarm redraws them at the next block of the plan and just after
// midnight (after midnight today's list comes from the week ahead, like the iPhone widgets).
package com.studyboardapp.studyboard.widgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.text.SpannableString
import android.text.format.DateFormat
import android.text.style.StrikethroughSpan
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import com.studyboardapp.studyboard.R
import java.util.Calendar
import java.util.Date

object HomeWidgets {
    const val ACTION_CHECK = "com.studyboardapp.studyboard.widgets.CHECK"
    const val ACTION_TICK = "com.studyboardapp.studyboard.widgets.TICK"
    const val EXTRA_TASK = "task"
    private const val MAIN = "com.studyboardapp.studyboard.MainActivity"

    private fun color(hex: String, fallback: Int): Int = try { Color.parseColor(hex) } catch (e: Exception) { fallback }

    private fun night(ctx: Context): Boolean =
        (ctx.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES

    /** The theme accent as text on the widget: in dark mode a dark accent is lightened until it reads on the dark background. */
    fun readable(c: Int, dark: Boolean): Int {
        if (!dark) return c
        var x = c
        fun lum(v: Int): Double {
            fun ch(n: Int): Double { val s = n / 255.0; return if (s <= 0.03928) s / 12.92 else Math.pow((s + 0.055) / 1.055, 2.4) }
            return 0.2126 * ch(Color.red(v)) + 0.7152 * ch(Color.green(v)) + 0.0722 * ch(Color.blue(v))
        }
        var i = 0
        while (lum(x) < 0.22 && i < 8) {   // about 4.5:1 on the dark card (#151B27)
            x = Color.rgb(Color.red(x) + (255 - Color.red(x)) / 4, Color.green(x) + (255 - Color.green(x)) / 4, Color.blue(x) + (255 - Color.blue(x)) / 4)
            i++
        }
        return x
    }

    /** Opens the app on a studyboard:// link (native-bridge.js passes it to the page: a task, or Today). */
    fun open(ctx: Context, link: String): PendingIntent {
        val i = Intent(Intent.ACTION_VIEW, Uri.parse(link)).setClassName(ctx.packageName, MAIN)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        return PendingIntent.getActivity(ctx, link.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun taskLink(id: String): String = "studyboard://open?task=" + Uri.encode(id)

    private fun check(ctx: Context, id: String): PendingIntent {
        // the data URI keeps each row's PendingIntent apart
        val i = Intent(ctx, WidgetActionReceiver::class.java).setAction(ACTION_CHECK).setData(Uri.parse("sbw://check/" + Uri.encode(id))).putExtra(EXTRA_TASK, id)
        return PendingIntent.getBroadcast(ctx, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun clock(ctx: Context): (Long) -> String = { ms -> DateFormat.getTimeFormat(ctx).format(Date(ms)) }
    private fun clockOf(ctx: Context): (String) -> String = { hhmm ->
        val p = hhmm.split(":").mapNotNull { it.toIntOrNull() }
        if (p.size < 2) hhmm else {
            val c = Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, p[0]); set(Calendar.MINUTE, p[1]) }
            DateFormat.getTimeFormat(ctx).format(c.time)
        }
    }

    fun ids(ctx: Context, cls: Class<*>): IntArray = try {
        AppWidgetManager.getInstance(ctx).getAppWidgetIds(ComponentName(ctx, cls))
    } catch (e: Exception) { IntArray(0) }

    /** Redraws every Studyboard widget on the home screen, and sets the next redraw. */
    fun updateAll(ctx: Context) {
        val m = AppWidgetManager.getInstance(ctx) ?: return
        for (id in ids(ctx, TodayWidgetProvider::class.java)) renderToday(ctx, m, id)
        for (id in ids(ctx, CountdownWidgetProvider::class.java)) renderCountdown(ctx, m, id)
        scheduleTick(ctx)
    }

    // "Biology Final in 3 days · ready 72%"
    fun examLine(e: WCountdown): String {
        val whenTxt = when (e.days) { 0 -> "today"; 1 -> "tomorrow"; else -> "in ${e.days} days" }
        return "${e.title} $whenTxt" + (e.ready?.let { " · ready $it%" } ?: "")
    }

    // the widget's size in dp, as the launcher reports it (portrait: the narrowest width and the tallest height)
    private fun size(m: AppWidgetManager, id: Int, w0: Int, h0: Int): Pair<Int, Int> {
        val opts: Bundle? = try { m.getAppWidgetOptions(id) } catch (e: Exception) { null }
        val h = opts?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0)?.takeIf { it > 0 } ?: h0
        val w = opts?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)?.takeIf { it > 0 } ?: w0
        return Pair(w, h)
    }

    fun renderToday(ctx: Context, m: AppWidgetManager, id: Int) {
        val (w, h) = size(m, id, 250, 200)
        m.updateAppWidget(id, todayViews(ctx, HomeWidgetStore.load(ctx), System.currentTimeMillis(), w, h))
    }

    fun renderCountdown(ctx: Context, m: AppWidgetManager, id: Int) {
        val (w, h) = size(m, id, 250, 60)
        m.updateAppWidget(id, countdownViews(ctx, HomeWidgetStore.load(ctx), System.currentTimeMillis(), w, h))
    }

    /** The Today widget for a saved day at a time and a size (dp). */
    fun todayViews(ctx: Context, day: org.json.JSONObject?, now: Long, w: Int, h: Int): RemoteViews {
        val model = HomeWidgetModel.today(day, now, clock(ctx), clockOf(ctx))
        val rv = RemoteViews(ctx.packageName, R.layout.sbw_today)
        rv.setOnClickPendingIntent(R.id.sbw_root, open(ctx, "studyboard://action/today"))
        if (model.setup) {
            rv.setViewVisibility(R.id.sbw_setup, View.VISIBLE)
            rv.setViewVisibility(R.id.sbw_body, View.GONE)
            return rv
        }
        rv.setViewVisibility(R.id.sbw_setup, View.GONE)
        rv.setViewVisibility(R.id.sbw_body, View.VISIBLE)
        val accent = color(model.accent, Color.rgb(44, 85, 214))
        val accentText = readable(accent, night(ctx))
        val narrow = w < 180
        // a short widget (2 rows) leaves the date out, so a task row fits under Do This Next
        val showDate = model.dateLabel.isNotEmpty() && h >= 180

        // Exam Mode: the countdown at the top
        val exam = model.exam
        if (exam != null) {
            rv.setViewVisibility(R.id.sbw_exam, View.VISIBLE)
            rv.setTextViewText(R.id.sbw_exam_text, examLine(exam))
            rv.setInt(R.id.sbw_exam_dot, "setColorFilter", color(exam.color, accent))
            rv.setOnClickPendingIntent(R.id.sbw_exam, open(ctx, taskLink(exam.id)))
        } else rv.setViewVisibility(R.id.sbw_exam, View.GONE)
        rv.setTextViewText(R.id.sbw_date, model.dateLabel)
        rv.setViewVisibility(R.id.sbw_date, if (showDate) View.VISIBLE else View.GONE)

        // Do This Next
        val next = model.next
        if (next != null) {
            rv.setViewVisibility(R.id.sbw_next, View.VISIBLE)
            rv.setTextColor(R.id.sbw_next_label, accentText)
            rv.setInt(R.id.sbw_next_bar, "setColorFilter", color(next.color, accent))
            rv.setTextViewText(R.id.sbw_next_title, next.title)
            val sub = listOf(next.course, next.why).filter { it.isNotEmpty() }.joinToString(" · ")
            rv.setTextViewText(R.id.sbw_next_sub, sub)
            rv.setViewVisibility(R.id.sbw_next_sub, if (sub.isEmpty()) View.GONE else View.VISIBLE)
            rv.setOnClickPendingIntent(R.id.sbw_next, open(ctx, taskLink(next.id)))
        } else rv.setViewVisibility(R.id.sbw_next, View.GONE)
        rv.setTextViewText(R.id.sbw_empty, model.empty)
        rv.setViewVisibility(R.id.sbw_empty, if (model.empty.isEmpty()) View.GONE else View.VISIBLE)

        // Time Cushion, when the page sends it
        val cu = model.cushion
        if (cu != null) {
            rv.setViewVisibility(R.id.sbw_cushion, View.VISIBLE)
            rv.setTextViewText(R.id.sbw_cushion_text, cu.text)
            val res = when (cu.state) { "spare" -> R.color.sbw_spare; "tight" -> R.color.sbw_tight; else -> R.color.sbw_short }
            rv.setInt(R.id.sbw_cushion_dot, "setColorFilter", ctx.getColor(res))
        } else rv.setViewVisibility(R.id.sbw_cushion, View.GONE)

        // as many rows as fit (dp): padding 24, date 20, exam 22, Do This Next 74 (92 when narrow: its title wraps), cushion 20,
        // "+N more" 18; a row is 32
        val nextH = if (next == null) 0 else if (narrow) 92 else 74
        val used = 24 + nextH + (if (showDate) 20 else 0) + (if (exam != null) 22 else 0) + (if (cu != null) 20 else 0) + (if (model.empty.isNotEmpty()) 26 else 0)
        val all = model.tasks.size + model.more
        var fit = ((h - used - 4) / 32).coerceIn(0, 8)
        var moreFits = fit >= all
        // room for "+N more" too when there's more than fits; when only the rows fit, the rows win
        if (fit < all) { val f2 = ((h - used - 4 - 18) / 32).coerceIn(0, 8); if (f2 >= 1) { fit = f2; moreFits = true } }
        rv.removeAllViews(R.id.sbw_list)
        val shown = model.tasks.take(fit)
        for (t in shown) {
            val row = RemoteViews(ctx.packageName, R.layout.sbw_today_row)
            // struck through when done (a styled text: RemoteViews can't set paint flags)
            row.setTextViewText(R.id.sbw_row_title, if (t.done) SpannableString(t.title).apply { setSpan(StrikethroughSpan(), 0, length, 0) } else t.title)
            row.setTextColor(R.id.sbw_row_title, ctx.getColor(if (t.done) R.color.sbw_done else R.color.sbw_ink))
            row.setTextViewText(R.id.sbw_row_meta, if (t.done) "" else t.meta)
            row.setTextColor(R.id.sbw_row_meta, ctx.getColor(if (t.late) R.color.sbw_short else R.color.sbw_muted))
            row.setViewVisibility(R.id.sbw_row_meta, if (narrow || t.done || t.meta.isEmpty()) View.GONE else View.VISIBLE)
            row.setInt(R.id.sbw_row_dot, "setColorFilter", color(t.color, accent))
            row.setImageViewResource(R.id.sbw_row_check, if (t.done) R.drawable.sbw_check_on else R.drawable.sbw_check_off)
            row.setContentDescription(R.id.sbw_row_check, if (t.done) "${t.title}, done" else "Mark ${t.title} done")
            if (!t.done) row.setOnClickPendingIntent(R.id.sbw_row_check, check(ctx, t.id))
            row.setOnClickPendingIntent(R.id.sbw_row_title, open(ctx, taskLink(t.id)))
            rv.addView(R.id.sbw_list, row)
        }
        val more = (model.tasks.size - shown.size) + model.more
        rv.setTextViewText(R.id.sbw_more, "+$more more")
        rv.setViewVisibility(R.id.sbw_more, if (more > 0 && shown.isNotEmpty() && moreFits) View.VISIBLE else View.GONE)
        return rv
    }

    /** The Countdown widget for a saved day at a time and a size (dp). */
    @Suppress("UNUSED_PARAMETER")
    fun countdownViews(ctx: Context, day: org.json.JSONObject?, now: Long, w: Int, h: Int): RemoteViews {
        val model = HomeWidgetModel.countdown(day, now)
        val rv = RemoteViews(ctx.packageName, R.layout.sbw_countdown)
        val item = model.item
        if (model.setup) {
            rv.setViewVisibility(R.id.sbc_setup, View.VISIBLE)
            rv.setViewVisibility(R.id.sbc_body, View.GONE)
            rv.setOnClickPendingIntent(R.id.sbc_root, open(ctx, "studyboard://action/today"))
            return rv
        }
        rv.setViewVisibility(R.id.sbc_setup, View.GONE)
        rv.setViewVisibility(R.id.sbc_body, View.VISIBLE)
        val accent = color(model.accent, Color.rgb(44, 85, 214))
        val dark = night(ctx)
        val compact = h < 70   // 1 row tall: the number, the title and "days left"
        if (item == null) {
            rv.setTextViewText(R.id.sbc_days, "")
            rv.setTextViewText(R.id.sbc_days_label, "")
            rv.setTextViewText(R.id.sbc_kind, "")
            rv.setTextViewText(R.id.sbc_title, "Nothing due this week")
            rv.setTextViewText(R.id.sbc_sub, "")
            rv.setViewVisibility(R.id.sbc_ready, View.GONE)
            rv.setOnClickPendingIntent(R.id.sbc_root, open(ctx, "studyboard://action/today"))
            return rv
        }
        rv.setTextColor(R.id.sbc_days, readable(if (item.exam) accent else color(item.color, accent), dark))
        if (item.days == 0) {
            rv.setTextViewText(R.id.sbc_days, "Today")
            rv.setTextViewTextSize(R.id.sbc_days, TypedValue.COMPLEX_UNIT_SP, 20f)
            rv.setTextViewText(R.id.sbc_days_label, "")
        } else {
            rv.setTextViewText(R.id.sbc_days, item.days.toString())
            rv.setTextViewTextSize(R.id.sbc_days, TypedValue.COMPLEX_UNIT_SP, if (compact) 26f else 34f)
            rv.setTextViewText(R.id.sbc_days_label, if (item.days == 1) "day" else "days")
        }
        rv.setTextViewText(R.id.sbc_kind, if (item.exam) "Exam" else "Next deadline")
        rv.setTextViewText(R.id.sbc_title, item.title)
        // 1 row tall: a smaller number, and the title on up to two smaller lines with nothing under it
        rv.setTextViewTextSize(R.id.sbc_title, TypedValue.COMPLEX_UNIT_SP, if (compact) 13f else 15f)
        val sub = listOf(item.course, item.ready?.let { "Ready $it%" } ?: "").filter { it.isNotEmpty() }.joinToString(" · ")
        rv.setTextViewText(R.id.sbc_sub, sub)
        rv.setViewVisibility(R.id.sbc_sub, if (sub.isEmpty() || compact) View.GONE else View.VISIBLE)
        // the kind and the readiness bar only when the widget is tall enough (2 rows)
        rv.setViewVisibility(R.id.sbc_kind, if (h >= 70) View.VISIBLE else View.GONE)
        val ready = item.ready
        if (ready != null && h >= 70) {
            rv.setViewVisibility(R.id.sbc_ready, View.VISIBLE)
            rv.setProgressBar(R.id.sbc_ready, 100, ready, false)
            // the bar in the theme accent (Android 12+; before that the course-free accent from res/drawable/sbw_progress.xml)
            if (android.os.Build.VERSION.SDK_INT >= 31) rv.setColorStateList(R.id.sbc_ready, "setProgressTintList", android.content.res.ColorStateList.valueOf(readable(accent, dark)))
        } else rv.setViewVisibility(R.id.sbc_ready, View.GONE)
        rv.setOnClickPendingIntent(R.id.sbc_root, open(ctx, taskLink(item.id)))
        return rv
    }

    /** The next moment a widget changes by itself: the next block of the plan starting or ending, a Focus ending, or just after
     *  midnight. Inexact and non-waking (RTC): it is delivered when the phone is next awake, which is when a widget can be seen. */
    fun scheduleTick(ctx: Context) {
        val am = ctx.getSystemService(AlarmManager::class.java) ?: return
        val pi = PendingIntent.getBroadcast(ctx, 7, Intent(ctx, WidgetActionReceiver::class.java).setAction(ACTION_TICK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        if (ids(ctx, TodayWidgetProvider::class.java).isEmpty() && ids(ctx, CountdownWidgetProvider::class.java).isEmpty()) { am.cancel(pi); return }
        val now = System.currentTimeMillis()
        val mid = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 5); set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        var at = mid
        val d = HomeWidgetStore.load(ctx)
        val plan = d?.optJSONArray("plan")
        if (plan != null) for (i in 0 until plan.length()) {
            val s = plan.optJSONObject(i) ?: continue
            for (t in longArrayOf(s.optLong("from"), s.optLong("to"))) if (t > now && t < at) at = t
        }
        val f = d?.optJSONObject("focus")
        if (f != null && f.optBoolean("running")) { val e = f.optLong("endsAt"); if (e > now && e < at) at = e }
        am.set(AlarmManager.RTC, at + 1000, pi)
    }
}

/** Today: Do This Next and today's tasks (2x2 to 4x4). */
class TodayWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) HomeWidgets.renderToday(context, appWidgetManager, id)
        HomeWidgets.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        HomeWidgets.renderToday(context, appWidgetManager, appWidgetId)
    }

    override fun onDisabled(context: Context) { HomeWidgets.scheduleTick(context) }
}

/** A tick on a row, the redraw alarm, and the clock or time zone changing. Not exported (the widget providers have to be, for the
 *  launcher), so no other app can tick off a student's tasks. */
class WidgetActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            HomeWidgets.ACTION_CHECK -> {
                val task = intent.getStringExtra(HomeWidgets.EXTRA_TASK) ?: return
                if (HomeWidgetStore.checkOff(context, task)) HomeWidgets.updateAll(context)
            }
            HomeWidgets.ACTION_TICK, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_LOCALE_CHANGED -> HomeWidgets.updateAll(context)
        }
    }
}

/** Countdown: the next exam or big deadline (2x1 to 4x2). */
class CountdownWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) HomeWidgets.renderCountdown(context, appWidgetManager, id)
        HomeWidgets.scheduleTick(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle) {
        HomeWidgets.renderCountdown(context, appWidgetManager, appWidgetId)
    }

    override fun onDisabled(context: Context) { HomeWidgets.scheduleTick(context) }
}
