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
