// UNTESTED on a device (compiled in the debug build only)
// "Block distracting apps" on Android: Do Not Disturb (the student's own Priority mode settings) for the length of a Focus session,
// through the notification-policy access the student grants once in Settings. It is put back the way it was:
//   - when the session ends (an alarm at the end time; exact when the system allows it without asking, otherwise within minutes),
//   - when the page stops it (Pause, Stop, a finished session),
//   - when the app was killed: the end time is stored and checked the next time the app (or the phone, after a restart) starts.
// Only a Do Not Disturb that Studyboard turned on is turned off again: if the student changed it in the meantime, it is left alone.
//
// JS (window.StudyboardNative.focusGuard, native-bridge.js section 12), plugin "StudyboardFocusGuard":
//   available()                -> {dnd, apps}   apps is always false on Android (no per-app blocking)
//   pickApps()                 -> {value: false}
//   start({until, dnd, apps})  -> {value}       asks for the access the first time (opens Settings), then turns DND on until `until`
//   stop()                     -> {value}
package com.studyboardapp.studyboard.focus

import android.app.ActivityManager
import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

object FocusGuardDnd {
    const val ACTION_END = "com.studyboardapp.studyboard.focus.GUARD_END"
    private const val PREFS = "sb_focus_guard"

    private fun prefs(ctx: Context) = ctx.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun nm(ctx: Context) = ctx.getSystemService(NotificationManager::class.java)

    /** Android Go (low-RAM) phones have no Do Not Disturb access for apps. */
    fun supported(ctx: Context): Boolean {
        val am = ctx.getSystemService(ActivityManager::class.java)
        if (am != null && am.isLowRamDevice) return false
        return Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).resolveActivity(ctx.packageManager) != null
    }

    fun granted(ctx: Context): Boolean = nm(ctx)?.isNotificationPolicyAccessGranted == true

    fun active(ctx: Context): Boolean = prefs(ctx).getLong("until", 0L) > 0L

    /** Turns DND on until the given time (ms since 1970). */
    fun start(ctx: Context, until: Long): Boolean {
        val n = nm(ctx) ?: return false
        if (!granted(ctx) || until <= System.currentTimeMillis()) return false
        val p = prefs(ctx)
        // the filter from before Studyboard's first start is kept across back-to-back sessions
        val prev = if (active(ctx)) p.getInt("prev", NotificationManager.INTERRUPTION_FILTER_ALL) else n.currentInterruptionFilter
        return try {
            n.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
            p.edit().putLong("until", until).putInt("prev", prev).putInt("ours", NotificationManager.INTERRUPTION_FILTER_PRIORITY).apply()
            schedule(ctx, until)
            true
        } catch (e: SecurityException) { false }
    }

    /** Puts DND back the way it was, if Studyboard's is still on. */
    fun stop(ctx: Context): Boolean {
        val p = prefs(ctx)
        if (!active(ctx)) return true
        val prev = p.getInt("prev", NotificationManager.INTERRUPTION_FILTER_ALL)
        val ours = p.getInt("ours", NotificationManager.INTERRUPTION_FILTER_PRIORITY)
        p.edit().clear().apply()
        cancelAlarm(ctx)
        val n = nm(ctx) ?: return false
        return try {
            if (granted(ctx) && n.currentInterruptionFilter == ours) n.setInterruptionFilter(prev)
            true
        } catch (e: SecurityException) { false }
    }

    /** On app start, phone restart or the end alarm: a session that has ended (or was abandoned when the app was killed) is undone. */
    fun check(ctx: Context) {
        val until = prefs(ctx).getLong("until", 0L)
        if (until <= 0L) return
        if (until <= System.currentTimeMillis()) stop(ctx) else schedule(ctx, until)
    }

    private fun pi(ctx: Context): PendingIntent =
        PendingIntent.getBroadcast(ctx, 4203, Intent(ctx, FocusGuardReceiver::class.java).setAction(ACTION_END).setPackage(ctx.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun schedule(ctx: Context, until: Long) {
        val am = ctx.getSystemService(AlarmManager::class.java) ?: return
        // exact when allowed without asking for anything (Android 11 and older, or the exact-alarm access already granted); otherwise
        // the system delivers it within a few minutes
        if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, until, pi(ctx))
        else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, until, pi(ctx))
    }

    private fun cancelAlarm(ctx: Context) {
        ctx.getSystemService(AlarmManager::class.java)?.cancel(pi(ctx))
    }
}

/** The end alarm, and a phone restart in the middle of a session. Not exported (BOOT_COMPLETED is a protected system broadcast). */
class FocusGuardReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            FocusGuardDnd.ACTION_END, Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> FocusGuardDnd.check(context)
        }
    }
}

@CapacitorPlugin(name = "StudyboardFocusGuard")
class StudyboardFocusGuardPlugin : Plugin() {
    private var pendingUntil = 0L

    override fun load() { FocusGuardDnd.check(context) }

    override fun handleOnResume() { FocusGuardDnd.check(context) }

    @PluginMethod
    fun available(call: PluginCall) {
        call.resolve(JSObject().put("dnd", FocusGuardDnd.supported(context)).put("apps", false))
    }

    @PluginMethod
    fun pickApps(call: PluginCall) { call.resolve(JSObject().put("value", false)) }

    @PluginMethod
    fun start(call: PluginCall) {
        val until = (call.getDouble("until") ?: 0.0).toLong()
        if (call.getBoolean("dnd", false) != true || until <= System.currentTimeMillis() || !FocusGuardDnd.supported(context)) {
            call.resolve(JSObject().put("value", false)); return
        }
        if (FocusGuardDnd.granted(context)) { call.resolve(JSObject().put("value", FocusGuardDnd.start(context, until))); return }
        // the first time: Settings > Do Not Disturb access, then back here
        pendingUntil = until
        try { startActivityForResult(call, Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS), "afterAccess") }
        catch (e: Exception) { call.resolve(JSObject().put("value", false)) }
    }

    @ActivityCallback
    private fun afterAccess(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        call.resolve(JSObject().put("value", FocusGuardDnd.granted(context) && FocusGuardDnd.start(context, pendingUntil)))
    }

    @PluginMethod
    fun stop(call: PluginCall) { call.resolve(JSObject().put("value", FocusGuardDnd.stop(context))) }
}
