// UNTESTED: written without compiler access. Build it in Xcode 26 or later and test on an iPhone with Apple Intelligence.
//
// StudyboardOnDeviceAI: Apple's on-device model (the Foundation Models framework, iOS 26 and later) for Studyboard's AI features,
// free and with no setup, for students with no AI key and no Studyboard AI. Everything runs on the iPhone: nothing is sent anywhere.
// The page side is src/js/01-ai-device.js (devApple), which also sends only one request at a time, cuts long material to fit
// the context, and uses the same quality steps as Chrome's built-in model (short sections, examples, a checking pass).
//
// Three calls:
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
//
// Add to the App target (Xcode: File > Add Files to "App", untick "Copy items if needed"). MainViewController registers it.
import Foundation
import UIKit
import Vision
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
        CAPPluginMethod(name: "recognizeText", returnType: CAPPluginReturnPromise)
    ]

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
