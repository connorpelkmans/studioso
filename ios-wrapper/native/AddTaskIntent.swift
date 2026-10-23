// UNTESTED: written without compiler access
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

    // verify: shape of ParameterSummary with a trailing builder for optional parameters
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
            SBCapture.enqueue(clean)
            return .result(dialog: IntentDialog("I saved \(shown) on your phone. Open Studyboard once and turn on Quick Capture in Settings to send it."))
        } catch {
            SBCapture.enqueue(clean)
            return .result(dialog: IntentDialog("I couldn't reach Studyboard, so I saved \(shown) on your phone. It will be added when you next open the app."))
        }
    }
}
