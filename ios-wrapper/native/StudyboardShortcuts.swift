// UNTESTED: written without compiler access
import AppIntents

// The sentences Siri knows with no setup. Every phrase must name the app (\(.applicationName)), and only an App Entity or
// App Enum can sit inside one: Siri listens for the names of the suggested assignments and courses (refreshed with
// updateAppShortcutParameters() each time the on-device copy changes, SBSiriIndex.refresh). A phrase without the name
// makes Siri ask "Which assignment?" and match the answer (EntityStringQuery). At most 10 App Shortcuts per app: "Next class" is a
// phrase of Class Times, and "Take a photo" (OpenCaptureIntent) is in the Shortcuts app and the Action Button but has no phrase.
struct StudyboardShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: [
                "Add a task to \(.applicationName)",
                "Add to \(.applicationName)",
                "Capture in \(.applicationName)",
                "New \(.applicationName) task"
            ],
            shortTitle: "Add Task",
            systemImageName: "plus.circle"
        )
        AppShortcut(
            intent: WhatsDueIntent(),
            phrases: [
                "What's due \(\.$range) in \(.applicationName)",
                "What do I have due \(\.$range) in \(.applicationName)",
                "What's due in \(.applicationName)",
                "What's on my \(.applicationName)",
                "What homework do I have in \(.applicationName)"
            ],
            shortTitle: "What's Due",
            systemImageName: "checklist"
        )
        AppShortcut(
            intent: AssignmentDueIntent(),
            phrases: [
                "When is \(\.$assignment) due in \(.applicationName)",
                "When's my \(\.$assignment) due in \(.applicationName)",
                "Ask \(.applicationName) when something is due",
                "When is an assignment due in \(.applicationName)"
            ],
            shortTitle: "When Is It Due",
            systemImageName: "calendar.badge.clock"
        )
        AppShortcut(
            intent: CourseGradeIntent(),
            phrases: [
                "What's my grade in \(\.$course) in \(.applicationName)",
                "What's my \(\.$course) grade in \(.applicationName)",
                "Ask \(.applicationName) for my grade",
                "What are my grades in \(.applicationName)"
            ],
            shortTitle: "Course Grade",
            systemImageName: "graduationcap"
        )
        AppShortcut(
            intent: AssignmentGradeIntent(),
            phrases: [
                "What did I get on \(\.$assignment) in \(.applicationName)",
                "What's my mark on \(\.$assignment) in \(.applicationName)",
                "Ask \(.applicationName) what I got on an assignment"
            ],
            shortTitle: "Assignment Grade",
            systemImageName: "checkmark.seal"
        )
        AppShortcut(
            intent: ClassTimeIntent(),
            phrases: [
                "When is \(\.$course) in \(.applicationName)",
                "What time is \(\.$course) in \(.applicationName)",
                "Where is \(\.$course) in \(.applicationName)",
                "What's my next class in \(.applicationName)",
                "When is my next class in \(.applicationName)",
                "\(.applicationName) next class"
            ],
            shortTitle: "Class Times",
            systemImageName: "clock"
        )
        AppShortcut(
            intent: TodayPlanIntent(),
            phrases: [
                "What should I work on in \(.applicationName)",
                "What should I work on now in \(.applicationName)",
                "How much do I have today in \(.applicationName)",
                "What's my plan today in \(.applicationName)",
                "What's next in \(.applicationName)"
            ],
            shortTitle: "Today's Plan",
            systemImageName: "list.bullet.clipboard"
        )
        AppShortcut(
            intent: StartFocusIntent(),
            phrases: [
                "Start studying in \(.applicationName)",
                "Start studying for \(\.$course) in \(.applicationName)",
                "Study \(\.$course) in \(.applicationName)",
                "Work on \(\.$task) in \(.applicationName)",
                "Start a focus session in \(.applicationName)",
                "Start a \(\.$length) focus session in \(.applicationName)",
                "Start a \(\.$length) \(.applicationName) session",
                "Start focusing in \(.applicationName)"
            ],
            shortTitle: "Start Focus",
            systemImageName: "timer"
        )
        AppShortcut(
            intent: FocusControlIntent(),
            phrases: [
                "\(\.$action) my \(.applicationName) timer",
                "\(\.$action) my focus session in \(.applicationName)",
                "\(\.$action) focus in \(.applicationName)",
                "\(\.$action) the timer in \(.applicationName)"
            ],
            shortTitle: "Pause or Stop Focus",
            systemImageName: "pause.circle"
        )
        AppShortcut(
            intent: MarkTaskDoneIntent(),
            phrases: [
                "Mark \(\.$assignment) done in \(.applicationName)",
                "Check off \(\.$assignment) in \(.applicationName)",
                "I finished \(\.$assignment) in \(.applicationName)",
                "Mark a task done in \(.applicationName)"
            ],
            shortTitle: "Mark Done",
            systemImageName: "checkmark.circle"
        )
    }

    static let shortcutTileColor: ShortcutTileColor = .blue
}
