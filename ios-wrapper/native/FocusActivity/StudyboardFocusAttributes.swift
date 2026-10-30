// UNTESTED: written without compiler access
import ActivityKit
import AppIntents
import Foundation

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
        if action != "reset" { await act.update(ActivityContent(state: s, staleDate: s.pausedLeft > 0 ? nil : s.endsAt.addingTimeInterval(60))) }
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
