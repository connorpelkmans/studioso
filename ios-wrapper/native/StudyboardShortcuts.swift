// UNTESTED: written without compiler access. App Target only. iOS 16+ (App Intents). Verify phrase behaviour on the current OS.
//
// Phrases MUST contain \(.applicationName) and may only interpolate AppEntity / AppEnum parameters. `task` is a free-form String, so it cannot
// be in a phrase: Siri asks "What's the task?" through requestValueDialog instead. Newer OS versions (Apple Intelligence Siri) may understand
// richer in-sentence parameters through other mechanisms (for example App Intents domains / assistant schemas, or an AppEntity-based
// parameter): verify against the current SDK before relying on it; this file deliberately uses only the stable form.
//
// Localisation: phrases are in code. Add AppShortcuts.strings (one per language) only when you translate them.
import AppIntents

struct StudyboardShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: [
                "Add a task to \(.applicationName)",
                "Add to \(.applicationName)",
                "Capture in \(.applicationName)"
            ],
            shortTitle: "Add Task",
            systemImageName: "plus.circle"
        )
        AppShortcut(
            intent: OpenCaptureIntent(),
            phrases: [
                "Take a photo for \(.applicationName)",
                "Scan notes with \(.applicationName)"
            ],
            shortTitle: "Capture Photo",
            systemImageName: "camera"
        )
    }

    static var shortcutTileColor: ShortcutTileColor = .blue
}
