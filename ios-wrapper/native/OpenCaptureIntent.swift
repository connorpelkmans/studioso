// UNTESTED: written without compiler access
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
