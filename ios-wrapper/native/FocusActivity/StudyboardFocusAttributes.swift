// UNTESTED: written without compiler access
import ActivityKit
import AppIntents
import Foundation
import UserNotifications

// The app itself supports iOS versions older than Live Activities, so the model says when it exists
@available(iOS 16.1, *)
public struct StudyboardFocusAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var mode: String
        public var label: String
        public var task: String
        public var startedAt: Date
        public var endsAt: Date
        public var pausedLeft: Int
        public var total: Int
        // what Skip moves to next, in order (the app works these out from your timer settings)
        public var plan: [Step]?
    }
    public struct Step: Codable, Hashable {
        public var mode: String
        public var label: String
        public var total: Int
    }
    public var accent: String
}

// Pause, Play and Skip on the Lock Screen and in the Dynamic Island. iOS runs this in the app (this file is in both the
// app and the widget): the timer card changes at once, and the app is told so its own timer follows
@available(iOS 17.0, *)
public struct StudyboardFocusControl: LiveActivityIntent {
    public static let title: LocalizedStringResource = "Focus Timer Control"
    public static let isDiscoverable: Bool = false
    @Parameter(title: "Action") public var action: String
    public init() { action = "pause" }
    public init(action: String) { self.action = action }

    public static let queueKey = "sbFocusActions"
    public static let changed = Notification.Name("sbFocusAction")

    public func perform() async throws -> some IntentResult {
        await Self.apply(action)
        return .result()
    }

    static func apply(_ action: String) async {
        let now = Date()
        guard let act = Activity<StudyboardFocusAttributes>.activities.first else { return }
        var s = act.content.state
        switch action {
        case "pause":
            guard s.pausedLeft == 0, s.endsAt > now else { return }
            s.pausedLeft = max(1, Int(s.endsAt.timeIntervalSince(now).rounded(.up)))
            s.endsAt = now.addingTimeInterval(Double(s.pausedLeft))
        case "play":
            guard s.pausedLeft > 0 else { return }
            s.endsAt = now.addingTimeInterval(Double(s.pausedLeft))
            s.startedAt = s.endsAt.addingTimeInterval(-Double(s.total))
            s.pausedLeft = 0
        case "skip":
            guard var plan = s.plan, !plan.isEmpty else { return }
            let next = plan.removeFirst()
            s.mode = next.mode; s.label = next.label; s.total = max(60, next.total)
            s.startedAt = now; s.endsAt = now.addingTimeInterval(Double(s.total)); s.pausedLeft = 0
            s.plan = plan
        case "reset":
            await act.end(nil, dismissalPolicy: .immediate)
        default:
            return
        }
        if action != "reset" { await act.update(ActivityContent(state: s, staleDate: s.pausedLeft > 0 ? nil : s.endsAt)) }
        StudyboardFocusAlarm.sync(mode: s.mode, endsAt: action == "reset" || s.pausedLeft > 0 ? nil : s.endsAt)
        let d = UserDefaults.standard
        var q = d.array(forKey: Self.queueKey) as? [[String: Any]] ?? []
        q.append(["a": action, "t": now.timeIntervalSince1970 * 1000])
        d.set(Array(q.suffix(20)), forKey: Self.queueKey)
        await MainActor.run { NotificationCenter.default.post(name: Self.changed, object: nil) }
    }
}

// Play and Pause as a switch: iOS flips a switch on the card the moment it's tapped, before the app has done anything,
// so the button changes instantly
@available(iOS 17.0, *)
public struct StudyboardFocusPlayPause: SetValueIntent, LiveActivityIntent {
    public static let title: LocalizedStringResource = "Play or Pause Focus Timer"
    public static let isDiscoverable: Bool = false
    @Parameter(title: "Running") public var value: Bool
    public init() { value = false }
    public func perform() async throws -> some IntentResult {
        await StudyboardFocusControl.apply(value ? "play" : "pause")
        return .result()
    }
}

// The alarm when a session ends: a notification iOS rings at the end time itself, with the alarm sound you picked, so it
// sounds with the app closed, the phone locked or the page paused (the page's own sound can't)
public enum StudyboardFocusAlarm {
    public static let id = "sb-focus-end"
    public static let soundKey = "sbAlarmSound"

    // ring at endsAt for a session in this mode, or no alarm (nil: paused or stopped)
    public static func sync(mode: String, endsAt: Date?) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [id])
        // iOS 26+, when allowed: a real alarm (StudyboardAlarmKit, in the app's plugin file) that rings through silent mode,
        // instead of the notification. Looked up by name, since this file is also built into the widget, which hasn't it.
        if let cls: AnyClass = NSClassFromString("StudyboardAlarmKit"), let ak = (cls as AnyObject) as? NSObjectProtocol {
            _ = ak.perform(NSSelectorFromString("syncMode:endsAt:"), with: mode as NSString, with: endsAt as NSDate?)
            if let ready = ak.perform(NSSelectorFromString("ready"))?.takeUnretainedValue() as? NSNumber, ready.boolValue { return }
        }
        guard let endsAt = endsAt, endsAt.timeIntervalSinceNow > 1 else { return }
        let c = UNMutableNotificationContent()
        c.title = mode == "focus" ? "Focus session complete" : "Break's over"
        c.body = mode == "focus" ? "Nice work. Time for a break." : "Ready for the next focus session?"
        c.sound = sound()
        if #available(iOS 15.0, *) { c.interruptionLevel = .timeSensitive }
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: endsAt.timeIntervalSinceNow, repeats: false)
        center.add(UNNotificationRequest(identifier: id, content: c, trigger: trigger))
    }

    // the picked sound, saved by the app in Library/Sounds (where iOS looks for notification sounds)
    static func sound() -> UNNotificationSound {
        let name = UserDefaults.standard.string(forKey: soundKey) ?? ""
        if !name.isEmpty, let dir = soundsDir(), FileManager.default.fileExists(atPath: dir.appendingPathComponent(name).path) {
            return UNNotificationSound(named: UNNotificationSoundName(rawValue: name))
        }
        return .default
    }

    public static func soundsDir() -> URL? {
        FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first?.appendingPathComponent("Sounds", isDirectory: true)
    }
}
