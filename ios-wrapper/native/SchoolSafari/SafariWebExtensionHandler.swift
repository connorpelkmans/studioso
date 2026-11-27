// UNTESTED: written without compiler access or a device
// StudyboardSafari extension target only (replaces the SafariWebExtensionHandler.swift Xcode makes for the target).
// Answers the two messages extension/src/background.js sends with browser.runtime.sendNativeMessage:
//   {v: 1, op: "wanted", granted: ["https://school.edu/*", ...]}  -> {v: 1, wanted: [{id, origin, need}]}
//   {v: 1, op: "handoff", id, origin, at, cookies: [...]}          -> {ok: true} or {error}
//   {v: 1, op: "result", id, origin, at, h: {...}}                 -> {ok: true} or {error}   (what it read, for the app to use
//                                                                       while the app's own sign-in has run out)
// Only Studyboard's own extension can send these (Safari routes an extension's native messages to the app that carries it).
import Foundation
import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem
        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) { message = item?.userInfo?[SFExtensionMessageKey] } else { message = item?.userInfo?["message"] }
        let reply = handle(message as? [String: Any] ?? [:])
        let out = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) { out.userInfo = [SFExtensionMessageKey: reply] } else { out.userInfo = ["message": reply] }
        context.completeRequest(returningItems: [out], completionHandler: nil)
    }

    private func handle(_ m: [String: Any]) -> [String: Any] {
        guard (m["v"] as? NSNumber)?.intValue == 1 else { return ["error": "bad-request"] }
        switch m["op"] as? String {
        case "wanted":
            SBSchoolHandoff.markSeen(granted: (m["granted"] as? [String]) ?? [])
            let list: [[String: Any]] = SBSchoolHandoff.wanted().map { ["id": $0.key, "origin": $0.value.origin, "need": $0.value.need] }
            return ["v": 1, "wanted": list]
        case "handoff":
            guard JSONSerialization.isValidJSONObject(m),
                  let d = try? JSONSerialization.data(withJSONObject: m), d.count < 600_000,
                  let h = try? JSONDecoder().decode(SBSchoolHandoff.Handoff.self, from: d) else { return ["error": "bad-request"] }
            return SBSchoolHandoff.store(h) ? ["ok": true] : ["error": "refused"]
        case "result":
            return SBSchoolHandoff.storeResult(m) ? ["ok": true] : ["error": "refused"]
        default:
            return ["error": "bad-request"]
        }
    }
}
