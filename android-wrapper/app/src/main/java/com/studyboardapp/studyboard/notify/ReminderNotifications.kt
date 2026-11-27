// UNTESTED on a device or watch (compiled in the debug build only; push needs google-services.json, see README-ANDROID.md section 4)
// Deadline reminders with Mark Done and Snooze 1 Hour. send-reminders sends Android reminders as FCM data messages (sbRem = "1"),
// so the app draws them itself with these two buttons; a Wear OS watch shows the phone's notification with the same buttons, and
// a press there runs here on the phone.
//
// A press works with the app closed: it goes straight to the server (the reminder's own one-time token, the same call the website's
// service worker makes) and is also put in a small queue the page drains when it next opens (window.StudyboardNative.notifActions,
// native-bridge.js section 13; src/js/71-native-actions.js), so the task is ticked off on this device at once, even offline.
// When the server can't be reached, Snooze falls back to a local alarm that shows the reminder again in an hour.
package com.studyboardapp.studyboard.notify

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.studyboardapp.studyboard.R
import com.studyboardapp.studyboard.widgets.HomeWidgets
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

object ReminderNotifications {
    const val CHANNEL = "sb_reminders"
    const val ACTION = "com.studyboardapp.studyboard.notify.REMINDER_ACTION"
    const val ACTION_AGAIN = "com.studyboardapp.studyboard.notify.REMINDER_AGAIN"
    const val SNOOZE_MIN = 60
    private const val PREFS = "sb_notif_actions"
    private val ID_RE = Regex("^[\\w.:-]{1,200}$")
    private val lock = Any()
    private val KEYS = listOf("title", "body", "rid", "taskId", "url", "tok", "api", "k")

    /** What a reminder carries (FCM data, all strings). */
    data class Rem(val title: String, val body: String, val rid: String, val taskId: String, val url: String, val tok: String, val api: String, val k: String) {
        fun toIntent(i: Intent): Intent { KEYS.zip(listOf(title, body, rid, taskId, url, tok, api, k)).forEach { (key, v) -> i.putExtra("sb_$key", v) }; return i }
        companion object {
            fun from(m: Map<String, String>): Rem? {
                val rid = m["rid"] ?: ""
                if (!ID_RE.matches(rid)) return null
                val task = (m["taskId"] ?: "").takeIf { ID_RE.matches(it) } ?: ""
                return Rem((m["title"] ?: "").take(200).ifEmpty { "Studyboard" }, (m["body"] ?: "").take(1000), rid, task, (m["url"] ?: "").take(500),
                    (m["tok"] ?: "").take(100), (m["api"] ?: "").take(300), (m["k"] ?: "").take(1000))
            }
            fun from(i: Intent): Rem? = from(KEYS.associateWith { i.getStringExtra("sb_$it") ?: "" })
        }
    }

    private fun prefs(ctx: Context) = ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun channel(ctx: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL) != null) return
        val ch = NotificationChannel(CHANNEL, ctx.getString(R.string.sbn_reminder_channel), NotificationManager.IMPORTANCE_HIGH)
        ch.description = ctx.getString(R.string.sbn_reminder_channel_desc)
        nm.createNotificationChannel(ch)
    }

    fun notifId(rid: String): Int = 5000 + (rid.hashCode() and 0x3fffffff) % 1_000_000

    private fun actionIntent(ctx: Context, r: Rem, verb: String): PendingIntent {
        val i = r.toIntent(Intent(ctx, ReminderActionReceiver::class.java).setAction(ACTION).setPackage(ctx.packageName)
            .setData(Uri.parse("sbrem://$verb/" + Uri.encode(r.rid))).putExtra("verb", verb))
        return PendingIntent.getBroadcast(ctx, (verb + r.rid).hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun show(ctx: Context, r: Rem) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        channel(ctx)
        val open = HomeWidgets.open(ctx, if (r.taskId.isNotEmpty()) HomeWidgets.taskLink(r.taskId) else "studyboard://action/today")
        val b = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_sbw_notify)
            .setContentTitle(r.title)
            .setContentText(r.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(r.body))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
        // Mark Done only for a task; Snooze for every reminder. Both show on a paired Wear OS watch too.
        if (r.taskId.isNotEmpty()) b.addAction(NotificationCompat.Action.Builder(R.drawable.ic_sbw_done, "Mark Done", actionIntent(ctx, r, "done")).build())
        b.addAction(NotificationCompat.Action.Builder(R.drawable.ic_sbw_snooze, "Snooze 1 Hour", actionIntent(ctx, r, "snooze")).build())
        try { NotificationManagerCompat.from(ctx).notify(notifId(r.rid), b.build()) } catch (e: SecurityException) { }
    }

    /** The reminder's own server call (send-reminders, action done/snooze, with its one-time token). Only to the app's Supabase project. */
    fun server(r: Rem, action: String): Boolean {
        if (r.tok.isEmpty() || !validApi(r.api)) return false
        return try {
            val c = URL(r.api).openConnection() as HttpURLConnection
            c.requestMethod = "POST"; c.connectTimeout = 8000; c.readTimeout = 8000; c.doOutput = true; c.instanceFollowRedirects = false
            c.setRequestProperty("Content-Type", "application/json")
            if (r.k.isNotEmpty()) { c.setRequestProperty("apikey", r.k); if (r.k.startsWith("eyJ")) c.setRequestProperty("Authorization", "Bearer " + r.k) }
            val body = JSONObject().put("action", action).put("id", r.rid).put("tok", r.tok).put("minutes", SNOOZE_MIN).toString()
            c.outputStream.use { it.write(body.toByteArray()) }
            val ok = c.responseCode in 200..299
            c.disconnect()
            ok
        } catch (e: Exception) { false }
    }

    fun validApi(api: String): Boolean = try {
        val u = java.net.URI(api)
        u.scheme == "https" && u.userInfo == null && u.port == -1 && u.host != null &&
            Regex("^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.supabase\\.co$").matches(u.host.lowercase()) && u.path == "/functions/v1/send-reminders"
    } catch (e: Exception) { false }

    // The queue the page drains: [{id, kind: "done"|"snooze", task, rid, at, until?, server}]
    fun queue(ctx: Context, o: JSONObject) {
        synchronized(lock) {
            val a = items(ctx)
            a.put(o)
            while (a.length() > 100) a.remove(0)
            prefs(ctx).edit().putString("q", a.toString()).apply()
        }
    }

    fun items(ctx: Context): JSONArray = synchronized(lock) {
        try { JSONArray(prefs(ctx).getString("q", "[]")) } catch (e: Exception) { JSONArray() }
    }

    fun remove(ctx: Context, ids: Collection<String>) {
        if (ids.isEmpty()) return
        synchronized(lock) {
            val drop = ids.toSet()
            val now = items(ctx)
            val next = JSONArray()
            for (i in 0 until now.length()) { val o = now.optJSONObject(i) ?: continue; if (o.optString("id") !in drop) next.put(o) }
            prefs(ctx).edit().putString("q", next.toString()).apply()
        }
    }

    /** Mark Done or Snooze pressed (off the main thread). */
    fun press(ctx: Context, r: Rem, verb: String) {
        NotificationManagerCompat.from(ctx).cancel(notifId(r.rid))
        val now = System.currentTimeMillis()
        val ok = server(r, verb)
        val o = JSONObject().put("id", UUID.randomUUID().toString()).put("kind", verb).put("task", r.taskId).put("rid", r.rid).put("at", now).put("server", ok)
        if (verb == "snooze") {
            val until = now + SNOOZE_MIN * 60_000L
            o.put("until", until)
            // the server will send it again; when it couldn't be reached, this phone shows it again itself
            if (!ok) again(ctx, r, until)
        }
        queue(ctx, o)
    }

    private fun again(ctx: Context, r: Rem, at: Long) {
        val am = ctx.getSystemService(AlarmManager::class.java) ?: return
        val i = r.toIntent(Intent(ctx, ReminderActionReceiver::class.java).setAction(ACTION_AGAIN).setPackage(ctx.packageName)
            .setData(Uri.parse("sbrem://again/" + Uri.encode(r.rid))))
        val pi = PendingIntent.getBroadcast(ctx, ("again" + r.rid).hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    }
}

/** Not exported: only this app's own PendingIntents (the notification's buttons, the snooze alarm) reach it. */
class ReminderActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val r = ReminderNotifications.Rem.from(intent) ?: return
        when (intent.action) {
            ReminderNotifications.ACTION_AGAIN -> ReminderNotifications.show(context, r)
            ReminderNotifications.ACTION -> {
                val verb = intent.getStringExtra("verb")
                if (verb != "done" && verb != "snooze") return
                if (verb == "done" && r.taskId.isEmpty()) return
                val app = context.applicationContext
                val pending = goAsync()
                Thread {
                    try { ReminderNotifications.press(app, r, verb) } finally { pending.finish() }
                }.start()
            }
        }
    }
}
