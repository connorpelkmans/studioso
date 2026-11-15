// UNTESTED: written without compiler access
// The page's side of the Home Screen and Lock Screen widgets (window.StudyboardNative.homeWidgets in native-bridge.js).
// Target: App. Needs StudyboardHomeWidgetData.swift in the App target too.
import Foundation
import Capacitor
import WidgetKit

@objc(StudyboardHomeWidgetsPlugin)
public class StudyboardHomeWidgetsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardHomeWidgetsPlugin"
    public let jsName = "StudyboardHomeWidgets"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]
    private var reload: DispatchWorkItem?

    // The day the widgets show. The page sends it after each change (at most every half second); the widgets are asked to
    // redraw a moment later, once a burst of changes has settled
    @objc func save(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let raw = json.data(using: .utf8), SBWStore.save(raw) else { return call.reject("invalid") }
        reloadSoon()
        call.resolve()
    }

    // Tasks checked off on a widget, oldest first
    @objc func drain(_ call: CAPPluginCall) {
        let items = SBWStore.actions().prefix(100).map { a -> [String: Any] in ["id": a.id, "kind": a.kind, "task": a.task, "at": a.at] }
        call.resolve(["items": Array(items)])
    }

    @objc func ack(_ call: CAPPluginCall) {
        SBWStore.removeActions(ids: call.getArray("ids", String.self) ?? [])
        call.resolve()
    }

    // Signing out: nothing of the student's stays on the Home Screen
    @objc func clear(_ call: CAPPluginCall) {
        SBWStore.clear()
        reloadSoon()
        call.resolve()
    }

    private func reloadSoon() {
        DispatchQueue.main.async {
            self.reload?.cancel()
            let w = DispatchWorkItem { WidgetCenter.shared.reloadAllTimelines() }
            self.reload = w
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: w)
        }
    }
}
