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

    public static let queueKey = SBFocusLive.queueKey
    public static let changed = SBFocusLive.changed

    public func perform() async throws -> some IntentResult {
        await Self.apply(action)
        return .result()
    }

    static func apply(_ action: String) async {
        _ = await SBFocusLive.apply(action)
    }
}

// The timer as the app last showed it, so Siri can pause, resume or stop it even with Lock Screen timers turned off.
// Written by the app (StudyboardFocusActivityPlugin.show / end) and by every change made here.
public struct SBFocusMirror: Codable {
    public var mode: String
    public var running: Bool
    public var endsAt: Double   // ms, when running
    public var left: Int        // seconds, when paused
    public var total: Int
    public var task: String

    static let key = "sbFocusMirror"

    public var active: Bool { running ? endsAt > Date().timeIntervalSince1970 * 1000 : left > 0 }
    public var secondsLeft: Int { running ? max(0, Int(endsAt / 1000 - Date().timeIntervalSince1970)) : left }

    public static func load() -> SBFocusMirror? {
        guard let d = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(SBFocusMirror.self, from: d)
    }

    public static func save(_ m: SBFocusMirror?) {
        if let m = m, let d = try? JSONEncoder().encode(m) { UserDefaults.standard.set(d, forKey: key) }
        else { UserDefaults.standard.removeObject(forKey: key) }
    }
}

// Pause, play, skip and reset, for the Lock Screen buttons and for Siri: the timer card changes at once, the alarm follows, and
// the app is told (a queue it reads with take(), plus a notification when it's running) so its own timer matches
public enum SBFocusLive {
    public static let queueKey = "sbFocusActions"
    public static let changed = Notification.Name("sbFocusAction")

    // hands an action to the app's timer
    public static func queue(_ entry: [String: Any]) async {
        let d = UserDefaults.standard
        var q = d.array(forKey: queueKey) as? [[String: Any]] ?? []
        q.append(entry)
        d.set(Array(q.suffix(20)), forKey: queueKey)
        await MainActor.run { NotificationCenter.default.post(name: changed, object: nil) }
    }

    // true when the timer changed. Uses the Lock Screen card when there is one, else the app's last saved timer.
    @discardableResult
    public static func apply(_ action: String) async -> Bool {
        if #available(iOS 16.2, *), Activity<StudyboardFocusAttributes>.activities.first != nil { return await applyCard(action) }
        return await applyMirror(action)
    }

    @available(iOS 16.2, *)
    private static func applyCard(_ action: String) async -> Bool {
        guard let act = Activity<StudyboardFocusAttributes>.activities.first else { return false }
        var s = act.content.state
        // the card keeps showing the time as it was until this lands, so it freezes or starts from now
        let now = Date()
        switch action {
        case "pause":
            guard s.pausedLeft == 0, s.endsAt > now else { return false }
            // rounded down, as iOS's running timer shows it, so the frozen time is the same number that was on screen
            s.pausedLeft = max(1, Int(s.endsAt.timeIntervalSince(now).rounded(.down)))
            s.endsAt = now.addingTimeInterval(Double(s.pausedLeft))
        case "play":
            guard s.pausedLeft > 0 else { return false }
            s.endsAt = now.addingTimeInterval(Double(s.pausedLeft))
            s.startedAt = s.endsAt.addingTimeInterval(-Double(s.total))
            s.pausedLeft = 0
        case "skip":
            guard var plan = s.plan, !plan.isEmpty else { return false }
            let next = plan.removeFirst()
            s.mode = next.mode; s.label = next.label; s.total = max(60, next.total)
            s.startedAt = now; s.endsAt = now.addingTimeInterval(Double(s.total)); s.pausedLeft = 0
            s.plan = plan
        case "reset":
            await act.end(nil, dismissalPolicy: .immediate)
        default:
            return false
        }
        if action != "reset" { await act.update(ActivityContent(state: s, staleDate: s.pausedLeft > 0 ? nil : s.endsAt)) }
        StudyboardFocusAlarm.sync(mode: s.mode, endsAt: action == "reset" || s.pausedLeft > 0 ? nil : s.endsAt)
        SBFocusMirror.save(action == "reset" ? nil : SBFocusMirror(mode: s.mode, running: s.pausedLeft == 0, endsAt: s.endsAt.timeIntervalSince1970 * 1000,
                                                                    left: s.pausedLeft, total: s.total, task: s.task))
        // with the exact result, so the app's own timer matches the card to the millisecond
        await queue(["a": action, "t": now.timeIntervalSince1970 * 1000, "left": s.pausedLeft, "end": s.endsAt.timeIntervalSince1970 * 1000])
        return true
    }

    // No Lock Screen card (Live Activities off, or an older iPhone): the same change on the app's last saved timer
    private static func applyMirror(_ action: String) async -> Bool {
        guard var m = SBFocusMirror.load(), m.active else { return false }
        let now = Date(), nowMs = now.timeIntervalSince1970 * 1000
        switch action {
        case "pause":
            guard m.running else { return false }
            m.left = max(1, m.secondsLeft); m.running = false; m.endsAt = nowMs + Double(m.left) * 1000
        case "play":
            guard !m.running, m.left > 0 else { return false }
            m.endsAt = nowMs + Double(m.left) * 1000; m.running = true; m.left = 0
        case "reset":
            break
        default:
            return false
        }
        StudyboardFocusAlarm.sync(mode: m.mode, endsAt: action == "reset" || !m.running ? nil : Date(timeIntervalSince1970: m.endsAt / 1000))
        SBFocusMirror.save(action == "reset" ? nil : m)
        await queue(["a": action, "t": nowMs, "left": m.running ? 0 : m.left, "end": m.endsAt])
        return true
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
        // decided from the card's own state (paused: play; running: pause), whatever value the switch passes
        let paused = (Activity<StudyboardFocusAttributes>.activities.first?.content.state.pausedLeft ?? 0) > 0
        await StudyboardFocusControl.apply(paused ? "play" : "pause")
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

    // "No Sound" picked: no alarm, and the notification arrives quietly
    public static var silent: Bool { UserDefaults.standard.string(forKey: soundKey) == "none" }

    // the picked sound, saved by the app in Library/Sounds (where iOS looks for notification sounds)
    static func sound() -> UNNotificationSound? {
        if silent { return nil }
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
