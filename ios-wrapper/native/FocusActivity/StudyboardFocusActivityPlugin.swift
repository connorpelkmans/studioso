// UNTESTED: written without compiler access
import Foundation
import Capacitor
import ActivityKit

@objc(StudyboardFocusActivityPlugin)
public class StudyboardFocusActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardFocusActivityPlugin"
    public let jsName = "StudyboardFocusActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "take", returnType: CAPPluginReturnPromise)
    ]
    private var watch: NSObjectProtocol?

    override public func load() {
        // a button on the Lock Screen was pressed while the app is running: tell the page
        watch = NotificationCenter.default.addObserver(forName: Notification.Name("sbFocusAction"), object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("action", data: [:])
        }
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
        guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else { return call.resolve(["shown": false]) }
        let mode = call.getString("mode") ?? "focus"
        guard Self.modes.contains(mode) else { return call.reject("invalid") }
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
        let content = ActivityContent(state: state, staleDate: running ? endsAt.addingTimeInterval(60) : nil)
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
        guard #available(iOS 16.2, *) else { return call.resolve() }
        Task {
            for a in Activity<StudyboardFocusAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            call.resolve()
        }
    }
}
