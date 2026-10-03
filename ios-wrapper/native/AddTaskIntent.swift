// UNTESTED: written without compiler access. App Target only. Requires iOS 16+ (App Intents). Verify against the current SDK (Xcode 26 / 27 beta).
//
// "Hey Siri, add a task to Studyboard" -> Siri asks "What's the task?" (requestValueDialog) -> POST to the capture endpoint -> spoken confirmation.
// Runs without opening the app (openAppWhenRun = false).
import AppIntents
import Foundation

struct AddTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Task"
    static var description = IntentDescription("Adds a task to your Studyboard board without opening the app.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Task", requestValueDialog: IntentDialog("What's the task?"))
    var task: String

    @Parameter(title: "Due")
    var due: String?

    @Parameter(title: "Course")
    var course: String?

    // verify: shape of ParameterSummary with a trailing builder for optional parameters (shown under "more" in the Shortcuts editor).
    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$task)") {
            \.$due
            \.$course
        }
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let item = PendingCapture(text: task, due: due, course: course, source: "siri")
        guard let clean = item.sanitized() else {
            return .result(dialog: IntentDialog("I didn't catch a task. Try again."))
        }
        let shown = clean.text ?? task
        do {
            let r = try await SBCapture.send(clean)
            if let s = r.speech?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty, s.count <= 200 {
                return .result(dialog: IntentDialog(stringLiteral: s))
            }
            return .result(dialog: IntentDialog("Added to Studyboard: \(shown)"))
        } catch CaptureError.notConfigured {
            // Not set up (no token yet): keep the task so it is not lost, and tell the person what to do.
            SBCapture.enqueue(clean)
            return .result(dialog: IntentDialog("I saved \(shown) on your phone. Open Studyboard once and turn on Quick Capture in Settings to send it."))
        } catch {
            // Offline, timeout, server error: queue it. The app adds it to the board next time it opens (StudyboardSharedQueue.drain).
            // NOTE: the spec asked to also open studyboard://add?... here. A single perform() cannot both finish silently and open the app on
            // every iOS version (the OpenURLIntent / requestToContinueInForeground APIs are newer: verify against the current SDK).
            SBCapture.enqueue(clean)
            return .result(dialog: IntentDialog("I couldn't reach Studyboard, so I saved \(shown) on your phone. It will be added when you next open the app."))
        }
    }
}
