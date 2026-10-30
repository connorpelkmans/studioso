// UNTESTED: written without compiler access
import Foundation
import Capacitor
import ActivityKit
import UserNotifications

@objc(StudyboardFocusActivityPlugin)
public class StudyboardFocusActivityPlugin: CAPPlugin, CAPBridgedPlugin, NotificationHandlerProtocol {
    public let identifier = "StudyboardFocusActivityPlugin"
    public let jsName = "StudyboardFocusActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "take", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hasSound", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "alarm", returnType: CAPPluginReturnPromise)
    ]
    private var watch: NSObjectProtocol?

    override public func load() {
        // the session-end alarm also rings with the app open (iOS keeps an open app's notifications quiet otherwise)
        if bridge?.notificationRouter.localNotificationHandler == nil { bridge?.notificationRouter.localNotificationHandler = self }
        // a button on the Lock Screen was pressed while the app is running: tell the page
        watch = NotificationCenter.default.addObserver(forName: Notification.Name("sbFocusAction"), object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("action", data: [:])
        }
    }

    public func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions {
        // in the app the page shows its own "session complete" sheet, so only the sound
        notification.request.identifier == StudyboardFocusAlarm.id ? [.sound, .list] : []
    }
    public func didReceive(response: UNNotificationResponse) {}

    private static func soundName(_ s: String?) -> String? {
        guard let s = s, s.range(of: "^sb-[a-z0-9-]{1,40}\\.wav$", options: .regularExpression) != nil else { return nil }
        return s
    }
    @objc func hasSound(_ call: CAPPluginCall) {
        guard let n = Self.soundName(call.getString("name")), let dir = StudyboardFocusAlarm.soundsDir() else { return call.resolve(["value": false]) }
        call.resolve(["value": FileManager.default.fileExists(atPath: dir.appendingPathComponent(n).path)])
    }
    // Ask once to ring at the end of a session, and save the alarm sound (a short .wav the page makes) for it to use
    @objc func alarm(_ call: CAPPluginCall) {
        if let n = Self.soundName(call.getString("name")), let dir = StudyboardFocusAlarm.soundsDir() {
            let f = dir.appendingPathComponent(n)
            if let b64 = call.getString("wav"), let data = Data(base64Encoded: b64), data.count < 3_000_000, !FileManager.default.fileExists(atPath: f.path) {
                try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
                // older sounds go, so they don't pile up as the sound or volume changes
                for old in (try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? [] where old.hasPrefix("sb-") { try? FileManager.default.removeItem(at: dir.appendingPathComponent(old)) }
                try? data.write(to: f)
            }
            if FileManager.default.fileExists(atPath: f.path) { UserDefaults.standard.set(n, forKey: StudyboardFocusAlarm.soundKey) }
        }
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { ok, _ in call.resolve(["allowed": ok]) }
    }

    // The Lock Screen button presses not yet applied in the app (oldest first), cleared as they're handed over
    @objc func take(_ call: CAPPluginCall) {
        let d = UserDefaults.standard, q = d.array(forKey: "sbFocusActions") as? [[String: Any]] ?? []
        d.removeObject(forKey: "sbFocusActions")
        call.resolve(["actions": q])
    }

    private static let modes: Set<String> = ["focus", "short", "long"]
    private static func clip(_ s: String?, _ n: Int) -> String { String((s ?? "").prefix(n)) }

    @available(iOS 16.1, *)
    private static func plan(_ raw: JSArray?) -> [StudyboardFocusAttributes.Step] {
        (raw ?? []).prefix(8).compactMap { v in
            guard let o = v as? JSObject, let m = o["mode"] as? String, modes.contains(m) else { return nil }
            let t = (o["total"] as? Int) ?? Int((o["total"] as? Double) ?? 1500)
            return StudyboardFocusAttributes.Step(mode: m, label: clip(o["label"] as? String, 24), total: max(60, min(6 * 3600, t)))
        }
    }

    @objc func available(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) { call.resolve(["value": ActivityAuthorizationInfo().areActivitiesEnabled]) }
        else { call.resolve(["value": false]) }
    }

    @objc func show(_ call: CAPPluginCall) {
        let mode = call.getString("mode") ?? "focus"
        guard Self.modes.contains(mode) else { return call.reject("invalid") }
        // the alarm, whether or not Live Activities are on
        let alarmMs = (call.getBool("running") ?? false) ? (call.getDouble("endsAt") ?? 0) : 0
        StudyboardFocusAlarm.sync(mode: mode, endsAt: alarmMs > 0 ? Date(timeIntervalSince1970: alarmMs / 1000) : nil)
        guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else { return call.resolve(["shown": false]) }
        let running = call.getBool("running") ?? false
        let total = max(60, min(6 * 3600, call.getInt("total") ?? 1500))
        let now = Date()
        var endsAt = now, startedAt = now, pausedLeft = 0
        if running {
            let ms = call.getDouble("endsAt") ?? 0
            endsAt = Date(timeIntervalSince1970: ms / 1000)
            guard endsAt > now, endsAt.timeIntervalSince(now) <= Double(total) + 5 else { return call.reject("invalid") }
            startedAt = endsAt.addingTimeInterval(-Double(total))
        } else {
            pausedLeft = max(1, min(total, call.getInt("left") ?? total))
            endsAt = now.addingTimeInterval(Double(pausedLeft))
        }
        let accentIn = call.getString("accent") ?? ""
        let accent = accentIn.range(of: "^#[0-9A-Fa-f]{6}$", options: .regularExpression) != nil ? accentIn : "#E5533D"
        let state = StudyboardFocusAttributes.ContentState(mode: mode, label: Self.clip(call.getString("label"), 24), task: Self.clip(call.getString("task"), 80),
                                                           startedAt: startedAt, endsAt: endsAt, pausedLeft: pausedLeft, total: total,
                                                           plan: Self.plan(call.getArray("plan")))
        let content = ActivityContent(state: state, staleDate: running ? endsAt : nil)
        Task {
            if let current = Activity<StudyboardFocusAttributes>.activities.first {
                await current.update(content)
                call.resolve(["shown": true])
            } else {
                do {
                    _ = try Activity.request(attributes: StudyboardFocusAttributes(accent: accent), content: content, pushType: nil)
                    call.resolve(["shown": true])
                } catch {
                    call.resolve(["shown": false])
                }
            }
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        StudyboardFocusAlarm.sync(mode: "focus", endsAt: nil)
        guard #available(iOS 16.2, *) else { return call.resolve() }
        Task {
            for a in Activity<StudyboardFocusAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve()
        }
    }
}
