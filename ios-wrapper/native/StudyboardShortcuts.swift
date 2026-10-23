// UNTESTED: written without compiler access
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
