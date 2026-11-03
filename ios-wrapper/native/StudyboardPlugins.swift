// UNTESTED: written without compiler access
import Foundation
import Capacitor

@objc(StudyboardCaptureTokenPlugin)
public class StudyboardCaptureTokenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardCaptureTokenPlugin"
    public let jsName = "StudyboardCaptureToken"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    @objc func save(_ call: CAPPluginCall) {
        guard let token = call.getString("token"), let endpoint = call.getString("endpoint"),
              token.range(of: "^[A-Za-z0-9._~+/-]{16,512}$", options: .regularExpression) != nil,
              SBCapture.validatedEndpoint(endpoint) != nil else { return call.reject("invalid") }
        SBCapture.saveCredentials(token: token, endpoint: endpoint) ? call.resolve() : call.reject("keychain")
    }

    @objc func clear(_ call: CAPPluginCall) {
        SBCapture.clearCredentials()
        call.resolve()
    }
}

// Ask Siri: the page (src/js/96-siri.js) hands over the on-device copy of tasks, marks, grades and class times
@objc(StudyboardSiriDataPlugin)
public class StudyboardSiriDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardSiriDataPlugin"
    public let jsName = "StudyboardSiriData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drainUpdates", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ackUpdates", returnType: CAPPluginReturnPromise)
    ]
    private var reindex: DispatchWorkItem?

    // Changes Siri made while the app was closed (iOS 27): the page applies them, then acknowledges them
    @objc func drainUpdates(_ call: CAPPluginCall) {
        let items = SBSiriUpdates.all().prefix(50).map { u -> [String: Any] in
            var d: [String: Any] = ["id": u.id, "task": u.task, "at": u.at]
            if let v = u.title { d["title"] = v }
            if let v = u.done { d["done"] = v }
            if let v = u.due { d["due"] = v }
            if let v = u.time { d["time"] = v }
            if let v = u.clearDue { d["clearDue"] = v }
            if let v = u.flagged { d["flagged"] = v }
            if let v = u.course { d["course"] = v }
            return d
        }
        call.resolve(["items": Array(items)])
    }

    @objc func ackUpdates(_ call: CAPPluginCall) {
        SBSiriUpdates.remove(ids: call.getArray("ids", String.self) ?? [])
        call.resolve()
    }

    @objc func save(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let data = json.data(using: .utf8), SBSiriStore.save(data) else { return call.reject("invalid") }
        scheduleReindex()
        call.resolve()
    }

    @objc func clear(_ call: CAPPluginCall) {
        SBSiriStore.clear()
        scheduleReindex()
        call.resolve()
    }

    // Spotlight and Siri's phrase names are refreshed at most every few seconds, however often the page saves
    private func scheduleReindex() {
        DispatchQueue.main.async {
            self.reindex?.cancel()
            let w = DispatchWorkItem { Task { await SBSiriIndex.refresh() } }
            self.reindex = w
            DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: w)
        }
    }
}

@objc(StudyboardSharedQueuePlugin)
public class StudyboardSharedQueuePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardSharedQueuePlugin"
    public let jsName = "StudyboardSharedQueue"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "drain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ack", returnType: CAPPluginReturnPromise)
    ]

    @objc func drain(_ call: CAPPluginCall) {
        var out: [[String: Any]] = []
        for it in SBCapture.pendingItems().prefix(50) {
            var d: [String: Any] = ["id": it.id, "kind": it.kind, "createdAt": it.createdAt]
            if let v = it.text { d["text"] = v }
            if let v = it.due { d["due"] = v }
            if let v = it.course { d["course"] = v }
            if let v = it.source { d["source"] = v }
            if let v = it.url { d["url"] = v }
            if let img = SBCapture.imageData(for: it) { d["image"] = "data:image/jpeg;base64," + img.base64EncodedString() }
            out.append(d)
        }
        call.resolve(["items": out])
    }

    @objc func ack(_ call: CAPPluginCall) {
        for id in call.getArray("ids", String.self) ?? [] { SBCapture.remove(id: id) }
        call.resolve()
    }
}
