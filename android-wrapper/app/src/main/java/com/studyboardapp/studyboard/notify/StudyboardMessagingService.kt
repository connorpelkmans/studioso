// UNTESTED on a device (compiled in the debug build only; push needs google-services.json, see README-ANDROID.md section 4)
// Takes the place of @capacitor/push-notifications' own MessagingService (the manifest removes that one), so Studyboard can draw its
// reminders with Mark Done and Snooze 1 Hour. Everything else is passed on to the Capacitor plugin unchanged (super), so the page's
// push token and its listeners work as before.
package com.studyboardapp.studyboard.notify

import com.capacitorjs.plugins.pushnotifications.MessagingService
import com.google.firebase.messaging.RemoteMessage

class StudyboardMessagingService : MessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        // a reminder from send-reminders (a data message: Android would otherwise draw it without buttons)
        if (data["sbRem"] == "1" && remoteMessage.notification == null) {
            ReminderNotifications.Rem.from(data)?.let { ReminderNotifications.show(applicationContext, it) }
        }
        super.onMessageReceived(remoteMessage)
    }
}
