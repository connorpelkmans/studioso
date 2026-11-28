// UNTESTED on a device or watch (compiled in the debug build only)
// The running Focus timer as an ongoing notification: a live countdown (the notification's own Chronometer, so it ticks with the app
// closed), Pause/Resume and Stop. On a Wear OS watch the same notification is marked as an Ongoing Activity (androidx.wear:wear-ongoing):
// see README-ANDROID.md for what reaches the watch from a phone app. The page drives it through the same calls as the iPhone's Live
// Activity (window.StudyboardNative.focusActivity.show/end/take/onAction, native-bridge.js section 7), so src/js/01-focus.js needs no
// Android-only code: Pause, Resume and Stop pressed here are queued with the moment they were pressed and applied by the page's
// pomoTakeLock() the next time it runs.
package com.studyboardapp.studyboard.focus

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.wear.ongoing.OngoingActivity
import androidx.wear.ongoing.Status
import com.studyboardapp.studyboard.R
import com.studyboardapp.studyboard.widgets.HomeWidgets
import org.json.JSONArray
import org.json.JSONObject

object FocusNotification {
    const val CHANNEL = "sb_focus"
    const val ID = 4201
    const val ACTION = "com.studyboardapp.studyboard.focus.ACTION"
    const val EXTRA_A = "a"
    private const val PREFS = "sb_focus_note"
    private val lock = Any()

    /** Called on the main thread when Pause/Resume/Stop is pressed, so the plugin can tell the page (StudyboardFocusActivityPlugin). */
    @Volatile var onAction: (() -> Unit)? = null

    data class State(val mode: String, val label: String, val task: String, val running: Boolean, val endsAt: Long, val left: Int,
                     val total: Int, val accent: String)

    private fun prefs(ctx: Context) = ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun channel(ctx: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL) != null) return
        val ch = NotificationChannel(CHANNEL, ctx.getString(R.string.sbn_focus_channel), NotificationManager.IMPORTANCE_LOW)
        ch.description = ctx.getString(R.string.sbn_focus_channel_desc)
        ch.setShowBadge(false)
        nm.createNotificationChannel(ch)
    }

    fun allowed(ctx: Context): Boolean =
        NotificationManagerCompat.from(ctx).areNotificationsEnabled() &&
            (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)

    fun save(ctx: Context, s: State) {
        synchronized(lock) {
            prefs(ctx).edit().putString("state", JSONObject().put("mode", s.mode).put("label", s.label).put("task", s.task).put("running", s.running)
                .put("endsAt", s.endsAt).put("left", s.left).put("total", s.total).put("accent", s.accent).toString()).apply()
        }
    }

    fun load(ctx: Context): State? = try {
        val o = JSONObject(prefs(ctx).getString("state", null) ?: return null)
        State(o.optString("mode", "focus"), o.optString("label", "Focus"), o.optString("task"), o.optBoolean("running"), o.optLong("endsAt"),
            o.optInt("left"), o.optInt("total", 1500), o.optString("accent"))
    } catch (e: Exception) { null }

    private fun mmss(secs: Int): String = String.format(java.util.Locale.US, "%d:%02d", secs / 60, secs % 60)

    private fun pending(ctx: Context, a: String): PendingIntent {
        val i = Intent(ctx, FocusActionReceiver::class.java).setAction(ACTION).putExtra(EXTRA_A, a).setPackage(ctx.packageName)
        return PendingIntent.getBroadcast(ctx, a.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    /** Posts (or replaces) the notification for this state. Returns false when notifications are off for Studyboard. */
    fun post(ctx: Context, s: State): Boolean {
        save(ctx, s)
        if (!allowed(ctx)) return false
        channel(ctx)
        val now = System.currentTimeMillis()
        if (s.running && s.endsAt <= now) { cancel(ctx); return true }
        val title = s.label.ifEmpty { if (s.mode == "focus") "Focus" else "Break" }
        val text = when {
            !s.running -> "Paused · ${mmss(s.left)} left" + (if (s.task.isNotEmpty()) " · ${s.task}" else "")
            s.task.isNotEmpty() -> s.task
            s.mode == "focus" -> "Focus session"
            else -> "Take a breather"
        }
        val open = HomeWidgets.open(ctx, "studyboard://action/focus")
        val b = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_sbw_notify)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(open)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(try { Color.parseColor(s.accent) } catch (e: Exception) { if (s.mode == "focus") Color.rgb(229, 72, 77) else Color.rgb(47, 158, 95) })
        if (s.running) {
            // the system's own countdown: right with the app closed
            b.setUsesChronometer(true).setChronometerCountDown(true).setWhen(s.endsAt).setShowWhen(true)
            b.setTimeoutAfter(s.endsAt - now + 1500)
            b.addAction(R.drawable.ic_sbw_pause, "Pause", pending(ctx, "pause"))
        } else {
            b.setShowWhen(false)
            b.addAction(R.drawable.ic_sbw_play, "Resume", pending(ctx, "play"))
        }
        b.addAction(R.drawable.ic_sbw_stop, "Stop", pending(ctx, "reset"))
        // Wear OS: an Ongoing Activity (the watch face's ongoing-activity icon and the recents list), with the same countdown
        if (Build.VERSION.SDK_INT >= 25) try {   // the library is API 25+ (overrideLibrary in the manifest); every Wear OS watch is
            val st = if (s.running) {
                val end = SystemClock.elapsedRealtime() + (s.endsAt - now)
                Status.Builder().addTemplate("#time# · #what#").addPart("time", Status.TimerPart(end)).addPart("what", Status.TextPart(title)).build()
            } else Status.Builder().addTemplate("Paused · #what#").addPart("what", Status.TextPart(title)).build()
            OngoingActivity.Builder(ctx, ID, b).setStaticIcon(R.drawable.ic_sbw_notify).setTouchIntent(open).setStatus(st)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH).build().apply(ctx)
        } catch (e: Throwable) { /* the notification still shows without it */ }
        return try { NotificationManagerCompat.from(ctx).notify(ID, b.build()); true } catch (e: SecurityException) { false }
    }

    fun cancel(ctx: Context) {
        NotificationManagerCompat.from(ctx).cancel(ID)
        synchronized(lock) { prefs(ctx).edit().remove("state").apply() }
    }

    // Presses waiting for the page: [{a, t, left?, end?}], oldest first, each handed over once (take)
    fun queue(ctx: Context, o: JSONObject) {
        synchronized(lock) {
            val a = try { JSONArray(prefs(ctx).getString("q", "[]")) } catch (e: Exception) { JSONArray() }
            a.put(o)
            while (a.length() > 20) a.remove(0)
            prefs(ctx).edit().putString("q", a.toString()).apply()
        }
    }

    fun take(ctx: Context): JSONArray = synchronized(lock) {
        val a = try { JSONArray(prefs(ctx).getString("q", "[]")) } catch (e: Exception) { JSONArray() }
        prefs(ctx).edit().putString("q", "[]").apply()
        a
    }

    /** Pause, Resume or Stop pressed on the notification (or on the watch): the notification changes at once, and the press waits
     *  for the page with the moment it happened, so the timer in the app ends up in exactly the same place. */
    fun press(ctx: Context, a: String) {
        val s = load(ctx) ?: run { cancel(ctx); return }
        val now = System.currentTimeMillis()
        when (a) {
            "pause" -> if (s.running) {
                val left = Math.max(1L, (s.endsAt - now + 999) / 1000).toInt()
                queue(ctx, JSONObject().put("a", "pause").put("t", now).put("left", left))
                post(ctx, s.copy(running = false, left = left, endsAt = 0))
            }
            "play" -> if (!s.running && s.left > 0) {
                val end = now + s.left * 1000L
                queue(ctx, JSONObject().put("a", "play").put("t", now).put("end", end))
                post(ctx, s.copy(running = true, endsAt = end, left = 0))
            }
            "reset" -> {
                queue(ctx, JSONObject().put("a", "reset").put("t", now))
                cancel(ctx)
            }
        }
        onAction?.invoke()
    }
}

/** Not exported: only this app's own PendingIntents reach it. */
class FocusActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != FocusNotification.ACTION) return
        val a = intent.getStringExtra(FocusNotification.EXTRA_A) ?: return
        if (a in setOf("pause", "play", "reset")) FocusNotification.press(context, a)
    }
}
