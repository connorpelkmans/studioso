// UNTESTED: written without compiler access. App Target only. iOS 16+.
// "Take a photo for Studyboard": opens the app straight into photo capture. It hands the route to the web layer through the same App Group
// queue (kind "route"); native-bridge.js drains it on resume and calls SBCAPTURE.handleUrl("studyboard://capture?photo=1").
import AppIntents
import Foundation

struct OpenCaptureIntent: AppIntent {
    static var title: LocalizedStringResource = "Capture a Photo"
    static var description = IntentDescription("Opens Studyboard ready to take a photo of notes or a board and turn it into tasks.")
    static var openAppWhenRun: Bool = true

    init() {}

    func perform() async throws -> some IntentResult {
        SBCapture.enqueueRoute("studyboard://capture?photo=1")
        return .result()
    }
}
