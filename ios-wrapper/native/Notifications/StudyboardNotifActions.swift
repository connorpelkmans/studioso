// UNTESTED: written without compiler access
// Mark Done and Snooze 1 Hour on reminder notifications, on the iPhone and on a paired Apple Watch (the watch shows the phone's
// notification with the same buttons, and a press there runs here on the phone). send-reminders puts the category in each push
// (SB_REMINDER_TASK: both buttons; SB_REMINDER: Snooze only). Neither button opens the app:
//   - the press goes straight to the server with the reminder's one-time token (the same call the website's service worker makes),
//   - and waits in a queue the page drains when it next opens (window.StudyboardNative.notifActions, native-bridge.js section 13;
//     src/js/71-native-actions.js), so the task is ticked off on this device at once, even offline;
//   - a Snooze the server couldn't take is shown again by the phone itself an hour later (a local notification).
// Every other notification (a tap on a reminder, the Focus alarm) is passed on to Capacitor's own handling unchanged.
// Target: App. MainViewController.swift installs it (and StudyboardBackgroundRefresh.register() at launch, for a press that starts
// the app in the background).
import Foundation
import Capacitor
import UIKit
import UserNotifications

@objc(StudyboardNotifActionsPlugin)
public class StudyboardNotifActionsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardNotifActionsPlugin"
    public let jsName = "StudyboardNotifActions"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "drain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ack", returnType: CAPPluginReturnPromise)
    ]

    // Presses waiting for the page, oldest first
    @objc func drain(_ call: CAPPluginCall) {
        call.resolve(["items": Array(SBNotifQueue.all().prefix(100))])
    }

    @objc func ack(_ call: CAPPluginCall) {
        SBNotifQueue.remove(ids: call.getArray("ids", String.self) ?? [])
        call.resolve()
    }

    // Called by name (MainViewController.swift), so the app builds without this file
    @objc public static func installDelegate() { SBNotifCenter.shared.install() }
}

enum SBNotifQueue {
    private static let key = "sbNotifActions"
    private static let lock = NSLock()

    static func all() -> [[String: Any]] {
        lock.lock(); defer { lock.unlock() }
        return UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
    }

    static func add(_ item: [String: Any]) {
        lock.lock(); defer { lock.unlock() }
        var list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
        list.append(item)
        UserDefaults.standard.set(Array(list.suffix(100)), forKey: key)
    }

    static func remove(ids: [String]) {
        let drop = Set(ids)
        lock.lock(); defer { lock.unlock() }
        let list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
        UserDefaults.standard.set(list.filter { !drop.contains(($0["id"] as? String) ?? "") }, forKey: key)
    }
}

final class SBNotifCenter: NSObject, UNUserNotificationCenterDelegate {
    static let shared = SBNotifCenter()
    static let done = "SB_DONE", snooze = "SB_SNOOZE"
    static let snoozeMinutes = 60
    // Capacitor's own delegate (its NotificationRouter), which everything else is passed to
    private weak var next: UNUserNotificationCenterDelegate?

    // Safe to call more than once: at launch (before Capacitor exists) and again once Capacitor has set its own delegate
    func install() {
        let center = UNUserNotificationCenter.current()
        if let d = center.delegate, d !== self { next = d }
        center.delegate = self
        let doneA = UNNotificationAction(identifier: Self.done, title: "Mark Done", options: [])
        let snoozeA = UNNotificationAction(identifier: Self.snooze, title: "Snooze 1 Hour", options: [])
        let ours: Set<UNNotificationCategory> = [
            UNNotificationCategory(identifier: "SB_REMINDER_TASK", actions: [doneA, snoozeA], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: "SB_REMINDER", actions: [snoozeA], intentIdentifiers: [], options: [])
        ]
        center.getNotificationCategories { have in
            center.setNotificationCategories(have.filter { !["SB_REMINDER_TASK", "SB_REMINDER"].contains($0.identifier) }.union(ours))
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if let n = next, n.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:willPresent:withCompletionHandler:))) {
            n.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler)
        } else {
            completionHandler([.banner, .list, .sound])
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let a = response.actionIdentifier
        guard a == Self.done || a == Self.snooze else {
            if let n = next, n.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:))) {
                n.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
            } else { completionHandler() }
            return
        }
        let content = response.notification.request.content
        let info = content.userInfo
        let str: (String) -> String = { (info[$0] as? String) ?? "" }
        let rid = str("rid"), task = str("taskId")
        guard rid.range(of: "^[A-Za-z0-9_.:-]{1,200}$", options: .regularExpression) != nil else { return completionHandler() }
        let verb = a == Self.done ? "done" : "snooze"
        if verb == "done" && task.isEmpty { return completionHandler() }
        // iOS gives a background press about 30 seconds: the server call has 8
        var bg = UIBackgroundTaskIdentifier.invalid
        bg = UIApplication.shared.beginBackgroundTask { UIApplication.shared.endBackgroundTask(bg); bg = .invalid }
        Self.server(api: str("api"), key: str("k"), rid: rid, tok: str("tok"), action: verb) { ok in
            let now = Date().timeIntervalSince1970 * 1000
            var item: [String: Any] = ["id": UUID().uuidString, "kind": verb, "task": task, "rid": rid, "at": now, "server": ok]
            if verb == "snooze" {
                let until = now + Double(Self.snoozeMinutes) * 60_000
                item["until"] = until
                if !ok { Self.again(content, after: TimeInterval(Self.snoozeMinutes * 60)) }
            }
            SBNotifQueue.add(item)
            DispatchQueue.main.async {
                completionHandler()
                if bg != .invalid { UIApplication.shared.endBackgroundTask(bg); bg = .invalid }
            }
        }
    }

    // send-reminders' done/snooze, only to the app's own Supabase project
    static func server(api: String, key: String, rid: String, tok: String, action: String, _ finish: @escaping (Bool) -> Void) {
        guard !tok.isEmpty, let u = URL(string: api), u.scheme == "https", u.port == nil, u.user == nil,
              let host = u.host?.lowercased(), host.hasSuffix(".supabase.co"), u.path == "/functions/v1/send-reminders" else { return finish(false) }
        var req = URLRequest(url: u, timeoutInterval: 8)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !key.isEmpty { req.setValue(key, forHTTPHeaderField: "apikey"); if key.hasPrefix("eyJ") { req.setValue("Bearer " + key, forHTTPHeaderField: "Authorization") } }
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["action": action, "id": rid, "tok": tok, "minutes": snoozeMinutes])
        URLSession.shared.dataTask(with: req) { _, resp, err in
            finish(err == nil && ((resp as? HTTPURLResponse)?.statusCode ?? 0) / 100 == 2)
        }.resume()
    }

    // The same reminder again later, from this phone
    static func again(_ content: UNNotificationContent, after secs: TimeInterval) {
        guard let c = content.mutableCopy() as? UNMutableNotificationContent else { return }
        let rid = (content.userInfo["rid"] as? String) ?? UUID().uuidString
        let req = UNNotificationRequest(identifier: "sb-snooze-" + rid, content: c, trigger: UNTimeIntervalNotificationTrigger(timeInterval: max(60, secs), repeats: false))
        UNUserNotificationCenter.current().add(req, withCompletionHandler: nil)
    }
}
