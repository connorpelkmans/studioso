// UNTESTED: written without compiler access. App target only. Local Capacitor plugin (Capacitor 6/7 CAPBridgedPlugin style, like StudyboardPlugins.swift),
// registered in MainViewController.capacitorDidLoad().
//
//   StudyboardFocusActivity.available() -> {value: Bool}       Live Activities are on for this app (iOS 16.2+, not switched off in Settings)
//   StudyboardFocusActivity.show({mode, label, task, running, endsAt, left, total, accent}) -> {shown: Bool}
//        Starts the Focus timer's Live Activity, or updates the one already showing. endsAt: ms since 1970 (running); left: seconds (paused).
//   StudyboardFocusActivity.end() -> {}                         Removes it at once (timer reset, finished and not continuing).
//
// The countdown itself is drawn by the system from endsAt (Text(timerInterval:)), so the page only calls show() when something changes
// (start, pause, resume, skip, a new session), never every second. Nothing here talks to a server: there is no push token.
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
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    private static let modes: Set<String> = ["focus", "short", "long"]
    private static func clip(_ s: String?, _ n: Int) -> String { String((s ?? "").prefix(n)) }

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
                                                           startedAt: startedAt, endsAt: endsAt, pausedLeft: pausedLeft, total: total)
        // Running: stale a minute after it should have ended, so an app that was closed never leaves "0:00" up for hours
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
