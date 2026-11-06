// UNTESTED: written without compiler access
// Siri for the study day: "what should I work on?" and "how much do I have today?" (Today's Plan, from the on-device copy),
// "mark my lab report done" on any iOS (iOS 27 also has the Reminders schema), and the focus timer: "start studying for bio",
// "start a 25-minute focus session", "pause / resume / stop my Studyboard timer".
// Starting a session opens Studyboard, since the app's own timer runs the session; pause, resume and stop work with the app closed
// (the Lock Screen timer changes at once and the app catches up when it opens, the same way the Lock Screen buttons work).
import AppIntents
import Foundation

enum SBPlanSay {
    static func iso(_ d: Date = Date()) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    // "45 minutes", "1 hour", "2 hours 30 minutes"
    static func duration(_ mins: Int) -> String {
        let m = max(1, mins), h = m / 60, r = m % 60
        let hs = h == 1 ? "1 hour" : "\(h) hours", rs = r == 1 ? "1 minute" : "\(r) minutes"
        if h == 0 { return rs }
        return r == 0 ? hs : hs + " " + rs
    }

    static func things(_ n: Int) -> String { n == 1 ? "1 thing" : "\(n) things" }

    // Today's Plan as it stands: only when it was made today, without what's been marked done since
    static func todayItems(_ snap: SBSnapshot) -> [SBSnapPlanItem]? {
        guard let p = snap.plan, p.day == iso() else { return nil }
        let done = Set(snap.tasks.filter { $0.done ?? false }.map { $0.id })
        return p.items.filter { !done.contains($0.id) }
    }

    // open tasks past their due date (or due time today)
    static func overdue(_ snap: SBSnapshot, now: Date = Date()) -> Int {
        let today = Calendar.current.startOfDay(for: now)
        return snap.tasks.filter { t in
            guard !(t.done ?? false), let day = SBSay.day(t.due) else { return false }
            if day < today { return true }
            if t.time?.count == 5, let at = SBSay.at(t.due, t.time), Calendar.current.isDate(day, inSameDayAs: today) { return at < now }
            return false
        }.count
    }

    static func courseSuffix(_ id: String?, _ snap: SBSnapshot) -> String {
        guard let id = id, !id.isEmpty, let c = snap.courses.first(where: { $0.id == id }) else { return "" }
        return " for " + SBAsk.courseLabel(c)
    }
}

// "What should I work on now?" / "How much do I have today?"
struct TodayPlanIntent: AppIntent {
    static let title: LocalizedStringResource = "Today's Plan"
    static let description = IntentDescription("Tells you what to work on now, and how much is in today's plan.")
    static let openAppWhenRun: Bool = false

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        let now = Date(), late = SBPlanSay.overdue(snap, now: now)
        let lateNote = late == 0 ? "" : late == 1 ? " You also have 1 overdue task." : " You also have \(late) overdue tasks."
        guard let items = SBPlanSay.todayItems(snap) else {
            return .result(dialog: IntentDialog(stringLiteral: "Open Studyboard once today so I can see today's plan." + lateNote))
        }
        let doneMins = snap.plan?.done ?? 0
        var s: String
        if let first = items.first {
            s = "Start with \(first.title)\(SBPlanSay.courseSuffix(first.course, snap)), for about \(SBPlanSay.duration(first.mins))."
            if items.count > 1 {
                let total = items.reduce(0) { $0 + $1.mins }
                s += " Today's plan has \(SBPlanSay.things(items.count)), about \(SBPlanSay.duration(total)) in all"
                s += doneMins >= 5 ? ", and you've done \(SBPlanSay.duration(doneMins)) already." : "."
            } else {
                s += " That's the last thing in today's plan."
            }
        } else {
            s = doneMins >= 5 ? "You've finished today's plan. Nice work." : "Nothing is planned for today."
        }
        return .result(dialog: IntentDialog(stringLiteral: s + lateNote + SBSay.staleNote(snap, now: now)))
    }
}

// "Mark my lab report done" (every iOS version; iOS 27's Siri can also use the Reminders schema)
struct MarkTaskDoneIntent: AppIntent {
    static let title: LocalizedStringResource = "Mark Task Done"
    static let description = IntentDescription("Marks a task in Studyboard done.")
    static let openAppWhenRun: Bool = false

    @Parameter(title: "Task", requestValueDialog: IntentDialog("Which task?"))
    var assignment: AssignmentEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Mark \(\.$assignment) done")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        guard let t = snap.tasks.first(where: { $0.id == assignment.id }) else {
            return .result(dialog: IntentDialog(stringLiteral: "I couldn't find \(assignment.title) in Studyboard anymore."))
        }
        if t.done ?? false { return .result(dialog: IntentDialog(stringLiteral: "\(t.title) is already done.")) }
        // waits on the phone; the app makes the change (undoable) when it opens, and Siri's next answers count it done already
        let u = SBSiriUpdate(task: t.id, done: true)
        SBSiriUpdates.add(u)
        SBSiriStore.apply(u)
        return .result(dialog: IntentDialog(stringLiteral: "Done. I marked \(t.title) done."))
    }
}

// MARK: Focus timer

// Said inside the sentence: "start a 25-minute focus session"
enum FocusLength: String, AppEnum {
    case m10 = "10", m15 = "15", m20 = "20", m25 = "25", m30 = "30", m45 = "45", m50 = "50", m60 = "60", m90 = "90"

    var minutes: Int { Int(rawValue) ?? 25 }

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Length"
    static let caseDisplayRepresentations: [FocusLength: DisplayRepresentation] = [
        .m10: DisplayRepresentation(title: "10-minute", synonyms: ["10 minute", "ten minute"]),
        .m15: DisplayRepresentation(title: "15-minute", synonyms: ["15 minute", "fifteen minute"]),
        .m20: DisplayRepresentation(title: "20-minute", synonyms: ["20 minute", "twenty minute"]),
        .m25: DisplayRepresentation(title: "25-minute", synonyms: ["25 minute", "twenty-five minute", "twenty five minute"]),
        .m30: DisplayRepresentation(title: "30-minute", synonyms: ["30 minute", "thirty minute", "half hour", "half-hour"]),
        .m45: DisplayRepresentation(title: "45-minute", synonyms: ["45 minute", "forty-five minute", "forty five minute"]),
        .m50: DisplayRepresentation(title: "50-minute", synonyms: ["50 minute", "fifty minute"]),
        .m60: DisplayRepresentation(title: "1-hour", synonyms: ["one hour", "hour-long", "hour long", "60 minute", "sixty minute"]),
        .m90: DisplayRepresentation(title: "90-minute", synonyms: ["90 minute", "ninety minute", "hour and a half"])
    ]
}

// "Start studying for bio", "start a 25-minute focus session", "work on my lab report"
struct StartFocusIntent: AppIntent {
    static let title: LocalizedStringResource = "Start Focus Session"
    static let description = IntentDescription("Starts Studyboard's focus timer, on a task, a course, or the first thing in today's plan.")
    // the app's own timer runs the session (and puts it on the Lock Screen), so it opens
    static let openAppWhenRun: Bool = true

    @Parameter(title: "Task")
    var task: AssignmentEntity?

    @Parameter(title: "Course")
    var course: CourseEntity?

    @Parameter(title: "Length")
    var length: FocusLength?

    static var parameterSummary: some ParameterSummary {
        Summary("Start a focus session") {
            \.$task
            \.$course
            \.$length
        }
    }

    init() {}

    // what to work on: the task named, else the course's first thing in today's plan (or its next due task), else the plan's first thing
    static func pick(_ snap: SBSnapshot?, task: AssignmentEntity?, course: CourseEntity?) -> (id: String, title: String, planMins: Int)? {
        let items = snap.flatMap { SBPlanSay.todayItems($0) } ?? []
        if let t = task { return (id: t.id, title: t.title, planMins: items.first(where: { $0.id == t.id })?.mins ?? 0) }
        guard let snap = snap else { return nil }
        if let c = course {
            if let i = items.first(where: { $0.course == c.id }) { return (id: i.id, title: i.title, planMins: i.mins) }
            let next = snap.tasks.filter { !($0.done ?? false) && $0.course == c.id }.sorted { ($0.due?.isEmpty == false ? $0.due! : "9999") < ($1.due?.isEmpty == false ? $1.due! : "9999") }.first
            return next.map { (id: $0.id, title: $0.title, planMins: 0) }
        }
        return items.first.map { (id: $0.id, title: $0.title, planMins: $0.mins) }
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let snap = SBSiriStore.load()
        let picked = Self.pick(snap, task: task, course: course)
        let usual = max(5, min(180, snap?.focus ?? 25))
        // as the app does: your timer length, cut short when the plan gives the task less time today
        var mins = length?.minutes ?? usual
        if length == nil, let p = picked?.planMins, p >= 5 { mins = min(usual, Int((Double(p) / 5).rounded()) * 5) }
        await SBFocusLive.queue(["a": "start", "t": Date().timeIntervalSince1970 * 1000, "task": picked?.id ?? "", "mins": mins])
        let s: String
        if let p = picked { s = "Starting \(SBPlanSay.duration(mins)) on \(p.title)." }
        else if let c = course { s = "Starting a \(mins)-minute focus session for \(c.name)." }
        else { s = "Starting a \(mins)-minute focus session." }
        return .result(dialog: IntentDialog(stringLiteral: s))
    }
}

enum FocusAction: String, AppEnum {
    case pause, resume, stop

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Action"
    static let caseDisplayRepresentations: [FocusAction: DisplayRepresentation] = [
        .pause: DisplayRepresentation(title: "Pause", synonyms: ["hold"]),
        .resume: DisplayRepresentation(title: "Resume", synonyms: ["continue", "unpause", "restart"]),
        .stop: DisplayRepresentation(title: "Stop", synonyms: ["end", "cancel", "finish"])
    ]
}

// "Pause my Studyboard timer", "resume focus in Studyboard", "stop my focus session in Studyboard"
struct FocusControlIntent: AppIntent {
    static let title: LocalizedStringResource = "Pause, Resume or Stop Focus"
    static let description = IntentDescription("Pauses, resumes or stops Studyboard's focus timer without opening the app.")
    static let openAppWhenRun: Bool = false

    @Parameter(title: "Action", default: .pause)
    var action: FocusAction

    static var parameterSummary: some ParameterSummary {
        Summary("\(\.$action) the focus timer")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let before = SBFocusMirror.load()
        guard let b = before, b.active else {
            return .result(dialog: IntentDialog("There's no focus session going. Say \"start studying in Studyboard\" to start one."))
        }
        let ok = await SBFocusLive.apply(action == .pause ? "pause" : action == .resume ? "play" : "reset")
        let left = SBPlanSay.duration(Int((Double(SBFocusMirror.load()?.secondsLeft ?? b.secondsLeft) / 60).rounded(.up)))
        let s: String
        switch action {
        case .pause: s = ok ? "Paused, with \(left) left." : "Your focus session is already paused."
        case .resume: s = ok ? "Back to it. \(left) left." : "Your focus session is already running, with \(left) left."
        case .stop: s = ok ? "Stopped your focus session." : "I couldn't stop it. Open Studyboard to stop the timer."
        }
        return .result(dialog: IntentDialog(stringLiteral: s))
    }
}
