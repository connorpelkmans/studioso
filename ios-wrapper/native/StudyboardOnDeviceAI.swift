// UNTESTED: written without compiler access. Build it in Xcode 26 or later and test on an iPhone with Apple Intelligence.
//
// StudyboardOnDeviceAI: Apple's on-device model (the Foundation Models framework, iOS 26 and later) for Studyboard's AI features,
// free and with no setup, for students with no AI key and no Studyboard AI. Everything runs on the iPhone: nothing is sent anywhere.
// The page side is src/js/01-ai-device.js (devApple), which also sends only one request at a time, cuts long material to fit
// the context, and uses the same quality steps as Chrome's built-in model (short sections, examples, a checking pass).
//
// Four calls:
//   availability() -> {status: "available" | "downloading" | "unavailable", reason, contextSize, images}
//   generate({system, prompt, schema, temperature}) -> {json} (with a schema) or {text}
//     schema is JSON Schema (type, properties, propertyOrder, items, required, enum, description), turned into a
//     DynamicGenerationSchema here, so the model can only answer in that shape (guided generation).
//     Errors reject with a short code the page understands: context, guardrail, refusal, rateLimited, concurrent, language,
//     unavailable, failed.
//   recognizeText({image: base64 JPEG or PNG}) -> {lines: [{text, confidence (0-1), x, y, width, height}], width, height}
//     Apple's Vision framework (iOS 13 and later, any iPhone), accurate mode with language correction: printed text and
//     handwriting, read on the device. The page (src/js/01-ocr.js) puts the lines back into paragraphs; a taller line is a heading.
//     Used for photos and scanned PDF pages, so the on-device model gets text. Positions are in pixels from the top left.
//   readPage({url}) -> {html, url, title}
//     Opens a web page in an invisible browser view on the phone (WebKit, like Safari, from the student's own connection), lets
//     its scripts run, and returns the page as it ended up. For Cards From a Link: pages built by JavaScript, and sites that turn
//     away simple readers but show the page to a browser. Nothing is kept: a private data store, no cookies kept, closed after.
//     The page's text is extracted in the app (src/js/01-page-text.js). Only http and https; 15 seconds at most.
//
// Add to the App target (Xcode: File > Add Files to "App", untick "Copy items if needed"). MainViewController registers it.
import Foundation
import UIKit
import Vision
import WebKit
import Capacitor
#if canImport(FoundationModels)
import FoundationModels
#endif

@objc(StudyboardOnDeviceAIPlugin)
public class StudyboardOnDeviceAIPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardOnDeviceAIPlugin"
    public let jsName = "StudyboardOnDeviceAI"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "availability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "recognizeText", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readPage", returnType: CAPPluginReturnPromise)
    ]
    private var readers: [StudyboardPageReader] = []

    @objc func availability(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            switch model.availability {
            case .available:
                guard model.supportsLocale(Locale.current) else {
                    call.resolve(["status": "unavailable", "reason": "language"])
                    return
                }
                var size = 4096
                if #available(iOS 26.4, *) { size = model.contextSize }
                // Pictures (iOS 27) stay off until they're tested with guided generation
                call.resolve(["status": "available", "contextSize": size, "images": false])
            case .unavailable(let reason):
                switch reason {
                case .modelNotReady: call.resolve(["status": "downloading", "reason": "modelNotReady"])
                case .appleIntelligenceNotEnabled: call.resolve(["status": "unavailable", "reason": "notEnabled"])
                case .deviceNotEligible: call.resolve(["status": "unavailable", "reason": "deviceNotEligible"])
                @unknown default: call.resolve(["status": "unavailable", "reason": "other"])
                }
            }
            return
        }
        #endif
        call.resolve(["status": "unavailable", "reason": "os"])
    }

    @objc func generate(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let system = call.getString("system") ?? ""
            let prompt = call.getString("prompt") ?? ""
            let schema = call.getObject("schema")
            let temperature = min(max(call.getDouble("temperature") ?? 0.3, 0), 1)
            Task {
                do {
                    // A new session for every request: the page sends each one complete, so nothing carries over and the
                    // context never fills up with earlier turns
                    let session = LanguageModelSession(instructions: system)
                    // No maximumResponseTokens: Apple notes a hard cap can cut guided output off mid-way
                    let options = GenerationOptions(temperature: temperature)
                    if let schema = schema, let built = try? StudyboardAISchema.build(schema) {
                        let r = try await session.respond(to: prompt, schema: built, options: options)
                        call.resolve(["json": r.content.jsonString])
                    } else {
                        let r = try await session.respond(to: prompt, options: options)
                        call.resolve(["text": r.content])
                    }
                } catch {
                    let code = StudyboardOnDeviceAIPlugin.code(for: error)
                    call.reject(code, code)
                }
            }
            return
        }
        #endif
        call.reject("unavailable", "unavailable")
    }

    @objc func recognizeText(_ call: CAPPluginCall) {
        guard let b64 = call.getString("image"), let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data), let cg = image.cgImage else {
            call.reject("badImage", "badImage")
            return
        }
        let orientation = StudyboardOnDeviceAIPlugin.cgOrientation(image.imageOrientation)
        DispatchQueue.global(qos: .userInitiated).async {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            if #available(iOS 16.0, *) { request.automaticallyDetectsLanguage = true }
            let handler = VNImageRequestHandler(cgImage: cg, orientation: orientation, options: [:])
            do {
                try handler.perform([request])
                // Vision's boxes are 0 to 1 from the bottom left; the page wants pixels from the top left of the upright picture
                let upright = [.left, .leftMirrored, .right, .rightMirrored].contains(orientation)
                let w = Double(upright ? cg.height : cg.width), h = Double(upright ? cg.width : cg.height)
                var lines: [[String: Any]] = []
                for o in request.results ?? [] {
                    guard let top = o.topCandidates(1).first else { continue }
                    let b = o.boundingBox
                    lines.append(["text": top.string, "confidence": Double(top.confidence),
                                  "x": Double(b.minX) * w, "y": (1 - Double(b.maxY)) * h,
                                  "width": Double(b.width) * w, "height": Double(b.height) * h])
                }
                // reading order: top to bottom, then left to right on the same line
                lines.sort { a, b in
                    let ay = a["y"] as? Double ?? 0, by = b["y"] as? Double ?? 0, ah = a["height"] as? Double ?? 0
                    if abs(ay - by) > ah * 0.5 { return ay < by }
                    return (a["x"] as? Double ?? 0) < (b["x"] as? Double ?? 0)
                }
                call.resolve(["lines": lines, "width": w, "height": h])
            } catch {
                call.reject("failed", "failed")
            }
        }
    }

    @objc func readPage(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), let scheme = url.scheme?.lowercased(), scheme == "https" || scheme == "http" else {
            call.reject("bad", "bad")
            return
        }
        DispatchQueue.main.async {
            let reader = StudyboardPageReader()
            self.readers.append(reader)
            reader.read(url) { result in
                self.readers.removeAll { $0 === reader }
                switch result {
                case .success(let page): call.resolve(page)
                case .failure(let e): call.reject(e.code, e.code)
                }
            }
        }
    }

    static func cgOrientation(_ o: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch o {
        case .up: return .up
        case .down: return .down
        case .left: return .left
        case .right: return .right
        case .upMirrored: return .upMirrored
        case .downMirrored: return .downMirrored
        case .leftMirrored: return .leftMirrored
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }

    // The error as one of the page's short codes
    static func code(for error: Error) -> String {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *), let e = error as? LanguageModelSession.GenerationError {
            switch e {
            case .exceededContextWindowSize: return "context"
            case .guardrailViolation: return "guardrail"
            case .refusal: return "refusal"
            case .rateLimited: return "rateLimited"
            case .concurrentRequests: return "concurrent"
            case .unsupportedLanguageOrLocale: return "language"
            case .assetsUnavailable: return "unavailable"
            default: return "failed"
            }
        }
        #endif
        // iOS 27 reports errors as LanguageModelError instead: read its name, so this file builds with either SDK
        let d = String(describing: error).lowercased()
        if d.contains("context") { return "context" }
        if d.contains("guardrail") { return "guardrail" }
        if d.contains("refusal") { return "refusal" }
        if d.contains("ratelimit") { return "rateLimited" }
        if d.contains("concurrent") { return "concurrent" }
        if d.contains("language") || d.contains("locale") { return "language" }
        return "failed"
    }
}

// An invisible WKWebView that loads one page, waits for its scripts, and hands back the resulting HTML
struct StudyboardReaderError: Error { let code: String }
final class StudyboardPageReader: NSObject, WKNavigationDelegate {
    private var web: WKWebView?
    private var timer: Timer?
    private var grabbed = false
    private var finish: ((Result<[String: Any], StudyboardReaderError>) -> Void)?

    func read(_ url: URL, completion: @escaping (Result<[String: Any], StudyboardReaderError>) -> Void) {
        let cfg = WKWebViewConfiguration()
        cfg.websiteDataStore = .nonPersistent()
        cfg.mediaTypesRequiringUserActionForPlayback = .all
        let web = WKWebView(frame: CGRect(x: 0, y: 0, width: 390, height: 844), configuration: cfg)
        web.navigationDelegate = self
        self.web = web
        finish = completion
        timer = Timer.scheduledTimer(withTimeInterval: 15, repeats: false) { [weak self] _ in self?.grab(timedOut: true) }
        web.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 12))
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // give the page's scripts a moment to put its text in place
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.grab(timedOut: false) }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { end(.failure(StudyboardReaderError(code: "unreachable"))) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { end(.failure(StudyboardReaderError(code: "unreachable"))) }
    // only web pages: no app links, downloads or other schemes
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let s = action.request.url?.scheme?.lowercased() ?? ""
        decisionHandler(s == "https" || s == "http" || s == "about" ? .allow : .cancel)
    }
    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if let http = response.response as? HTTPURLResponse, response.isForMainFrame {
            let code: String? = http.statusCode == 401 || http.statusCode == 402 ? "paywall"
                : http.statusCode == 403 || http.statusCode == 429 ? "blocked"
                : http.statusCode >= 400 ? "unreachable"
                : http.mimeType == "application/pdf" ? "pdf" : nil
            if let code = code { decisionHandler(.cancel); end(.failure(StudyboardReaderError(code: code))); return }
        }
        decisionHandler(.allow)
    }
    private func grab(timedOut: Bool) {
        guard !grabbed, let web = web else { return }
        grabbed = true
        web.evaluateJavaScript("[document.documentElement.outerHTML, location.href, document.title]") { [weak self] value, _ in
            guard let parts = value as? [Any], parts.count == 3, let html = parts[0] as? String else {
                self?.end(.failure(StudyboardReaderError(code: timedOut ? "unreachable" : "empty")))
                return
            }
            self?.end(.success(["html": String(html.prefix(2_000_000)), "url": parts[1] as? String ?? "", "title": parts[2] as? String ?? ""]))
        }
    }
    private func end(_ result: Result<[String: Any], StudyboardReaderError>) {
        timer?.invalidate(); timer = nil
        guard let finish = finish else { return }
        self.finish = nil
        web?.stopLoading(); web?.navigationDelegate = nil; web = nil
        finish(result)
    }
}

#if canImport(FoundationModels)
// JSON Schema (as the page sends it) to the DynamicGenerationSchema the model is guided by. Property order matters (the model writes
// fields in this order, so a card's source sentence comes before the card), and a Swift dictionary has none, so the page sends it
// in propertyOrder. Every named schema gets a unique name.
@available(iOS 26.0, *)
enum StudyboardAISchema {
    static func build(_ json: [String: Any]) throws -> GenerationSchema {
        var used = Set<String>()
        let root = node(json, name: "Root", used: &used)
        return try GenerationSchema(root: root, dependencies: [])
    }

    static func unique(_ base: String, _ used: inout Set<String>) -> String {
        var name = base, i = 2
        while used.contains(name) { name = "\(base)\(i)"; i += 1 }
        used.insert(name)
        return name
    }

    static func node(_ j: [String: Any], name: String, used: inout Set<String>) -> DynamicGenerationSchema {
        let type = (j["type"] as? String ?? "string").lowercased()
        let description = j["description"] as? String
        switch type {
        case "object":
            let props = j["properties"] as? [String: Any] ?? [:]
            let required = Set(j["required"] as? [String] ?? [])
            let order = (j["propertyOrder"] as? [String] ?? []).filter { props[$0] != nil }
            let keys = order + props.keys.filter { !order.contains($0) }.sorted()
            let me = unique(name, &used)
            let properties: [DynamicGenerationSchema.Property] = keys.compactMap { key in
                guard let p = props[key] as? [String: Any] else { return nil }
                return DynamicGenerationSchema.Property(name: key, description: p["description"] as? String,
                                                        schema: node(p, name: me + cap(key), used: &used),
                                                        isOptional: !required.contains(key))
            }
            return DynamicGenerationSchema(name: me, description: description, properties: properties)
        case "array":
            let items = j["items"] as? [String: Any] ?? ["type": "string"]
            return DynamicGenerationSchema(arrayOf: node(items, name: name + "Item", used: &used), minimumElements: nil, maximumElements: nil)
        case "integer":
            return DynamicGenerationSchema(type: Int.self, guides: [])
        case "number":
            return DynamicGenerationSchema(type: Double.self, guides: [])
        case "boolean":
            return DynamicGenerationSchema(type: Bool.self, guides: [])
        default:
            if let choices = j["enum"] as? [String], !choices.isEmpty {
                return DynamicGenerationSchema(name: unique(name, &used), description: description, anyOf: choices)
            }
            return DynamicGenerationSchema(type: String.self, guides: [])
        }
    }

    static func cap(_ s: String) -> String { s.prefix(1).uppercased() + s.dropFirst() }
}
#endif
