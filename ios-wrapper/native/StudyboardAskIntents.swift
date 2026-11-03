// UNTESTED: written without compiler access
// Ask Siri about your work, without opening the app: when something is due, what's due soon, what you got on an assignment,
// your grade in a course, when a class meets and what your next class is. Answers come from the on-device copy
// (SBSiriData.swift), so they work offline and need no account token. Grades are asked only after the phone is unlocked.
import AppIntents
import Foundation

enum SBAsk {
    static let noData = "Open Studyboard once so I can see your assignments and classes."
    static let gradesOff = "Grades are turned off for Siri. You can turn them on in Studyboard, under Settings, Voice Assistants & Shortcuts."

    static func snapshot() -> SBSnapshot? { SBSiriStore.load() }

    static func courseLabel(_ c: SBSnapCourse) -> String { c.code?.isEmpty == false ? c.code! : c.name }

    static func taskLine(_ t: SBSnapTask, _ snap: SBSnapshot, now: Date = Date()) -> String {
        let w = SBSay.when(t.due, t.time, now: now)
        return w.isEmpty ? t.title : t.title + " " + w
    }
}

// "When is my bio lab report due?"
struct AssignmentDueIntent: AppIntent {
    static let title: LocalizedStringResource = "When Is It Due"
    static let description = IntentDescription("Tells you when an assignment, exam or task in Studyboard is due.")
    static let openAppWhenRun: Bool = false

    @Parameter(title: "Assignment", requestValueDialog: IntentDialog("Which assignment?"))
    var assignment: AssignmentEntity

    static var parameterSummary: some ParameterSummary {
        Summary("When is \(\.$assignment) due")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        guard let t = snap.tasks.first(where: { $0.id == assignment.id }) else {
            return .result(dialog: IntentDialog(stringLiteral: "I couldn't find \(assignment.title) in Studyboard anymore."))
        }
        let now = Date()
        let label = snap.courses.first(where: { $0.id == t.course }).map { t.title + " for " + SBAsk.courseLabel($0) } ?? t.title
        let s: String
        if let due = SBSay.at(t.due, t.time) {
            let w = SBSay.when(t.due, t.time, now: now)
            let past = t.time?.isEmpty == false ? due < now : Calendar.current.startOfDay(for: now) > due
            if t.done ?? false { s = "\(label) is done. It was due \(w)." }
            else if past { s = "\(label) was due \(w). It's not marked done yet." }
            else { s = "\(label) is due \(w)." }
        } else {
            s = (t.done ?? false) ? "\(label) is done, and it didn't have a due date." : "\(label) doesn't have a due date."
        }
        return .result(dialog: IntentDialog(stringLiteral: s + SBSay.staleNote(snap, now: now)))
    }
}

enum DueRange: String, AppEnum {
    case today, tomorrow, week, overdue

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "When"
    static let caseDisplayRepresentations: [DueRange: DisplayRepresentation] = [
        .today: "today",
        .tomorrow: "tomorrow",
        .week: "this week",
        .overdue: "overdue"
    ]
}

// "What's due this week?"
struct WhatsDueIntent: AppIntent {
    static let title: LocalizedStringResource = "What's Due"
    static let description = IntentDescription("Lists what's due today, tomorrow, in the next 7 days, or overdue.")
    static let openAppWhenRun: Bool = false

    @Parameter(title: "When", default: .week)
    var range: DueRange

    static var parameterSummary: some ParameterSummary {
        Summary("What's due \(\.$range)")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        let cal = Calendar.current, now = Date(), today = cal.startOfDay(for: now)
        let open = snap.tasks.filter { !($0.done ?? false) }
        func dayOf(_ t: SBSnapTask) -> Date? { SBSay.day(t.due) }
        let picked: [SBSnapTask]
        let words: String
        switch range {
        case .today:
            picked = open.filter { dayOf($0).map { cal.isDate($0, inSameDayAs: today) } ?? false }
            words = "today"
        case .tomorrow:
            let tm = cal.date(byAdding: .day, value: 1, to: today)!
            picked = open.filter { dayOf($0).map { cal.isDate($0, inSameDayAs: tm) } ?? false }
            words = "tomorrow"
        case .week:
            let end = cal.date(byAdding: .day, value: 7, to: today)!
            picked = open.filter { dayOf($0).map { $0 >= today && $0 < end } ?? false }
            words = "in the next 7 days"
        case .overdue:
            picked = open.filter { dayOf($0).map { $0 < today } ?? false }
            words = "overdue"
        }
        let late = range == .overdue ? 0 : open.filter { dayOf($0).map { $0 < today } ?? false }.count
        let lateNote = late > 0 ? " You also have \(late) overdue." : ""
        if picked.isEmpty {
            let s = range == .overdue ? "Nothing is overdue. Nice." : "Nothing is due \(words)."
            return .result(dialog: IntentDialog(stringLiteral: s + lateNote + SBSay.staleNote(snap, now: now)))
        }
        let first = picked.prefix(5).map { t -> String in
            if range == .today || range == .tomorrow { return t.time?.isEmpty == false ? t.title + " at " + SBSay.time(SBSay.at(t.due, t.time)!) : t.title }
            return SBAsk.taskLine(t, snap, now: now)
        }
        let more = picked.count > 5 ? ", and \(picked.count - 5) more" : ""
        let n = picked.count == 1 ? "1 thing" : "\(picked.count) things"
        let head = range == .overdue ? "You have \(n) overdue: " : "You have \(n) due \(words): "
        return .result(dialog: IntentDialog(stringLiteral: head + SBSay.list(Array(first)) + more + "." + lateNote + SBSay.staleNote(snap, now: now)))
    }
}

// "What did I get on my chem midterm?"
struct AssignmentGradeIntent: AppIntent {
    static let title: LocalizedStringResource = "Assignment Grade"
    static let description = IntentDescription("Tells you the mark you got on an assignment, quiz or exam.")
    static let openAppWhenRun: Bool = false
    // marks are private: Siri asks for Face ID or the passcode first on a locked phone. verify: available on your deployment target
    static let authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

    @Parameter(title: "Assignment", requestValueDialog: IntentDialog("Which assignment?"))
    var assignment: AssignmentEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Mark on \(\.$assignment)")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        guard snap.grades else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.gradesOff)) }
        guard let t = snap.tasks.first(where: { $0.id == assignment.id }) else {
            return .result(dialog: IntentDialog(stringLiteral: "I couldn't find \(assignment.title) in Studyboard anymore."))
        }
        guard let m = t.mark, let p = m.pct else {
            return .result(dialog: IntentDialog(stringLiteral: "There's no mark on \(t.title) yet." + SBSay.staleNote(snap)))
        }
        var s = "You got "
        if let txt = m.text, !txt.isEmpty, txt != SBSay.pct(p) { s += txt + " on \(t.title). That's " + SBSay.pct(p) }
        else { s += SBSay.pct(p) + " on \(t.title)" }
        if let l = SBSay.letter(m.letter) { s += ", " + l }
        return .result(dialog: IntentDialog(stringLiteral: s + "." + SBSay.staleNote(snap)))
    }
}

// "What's my grade in biology?"
struct CourseGradeIntent: AppIntent {
    static let title: LocalizedStringResource = "Course Grade"
    static let description = IntentDescription("Tells you your current grade in a course, from the marks in Studyboard's Grade Tracker.")
    static let openAppWhenRun: Bool = false
    static let authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

    @Parameter(title: "Course", requestValueDialog: IntentDialog("Which course?"))
    var course: CourseEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Grade in \(\.$course)")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        guard snap.grades else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.gradesOff)) }
        guard let c = snap.courses.first(where: { $0.id == course.id }) else {
            return .result(dialog: IntentDialog(stringLiteral: "I couldn't find \(course.name) in Studyboard anymore."))
        }
        let name = SBAsk.courseLabel(c)
        guard let g = c.grade, let p = g.pct else {
            return .result(dialog: IntentDialog(stringLiteral: "There are no marks in \(name) yet." + SBSay.staleNote(snap)))
        }
        var s = "Your grade in \(name) is " + SBSay.pct(p)
        if let l = SBSay.letter(g.letter) { s += ", " + l }
        if let w = g.marked, w > 0, w < 100 { s += ", from the " + SBSay.pct(w) + " of the course that's marked so far" }
        return .result(dialog: IntentDialog(stringLiteral: s + "." + SBSay.staleNote(snap)))
    }
}

// "When is chem?"
struct ClassTimeIntent: AppIntent {
    static let title: LocalizedStringResource = "Class Times"
    static let description = IntentDescription("Tells you when and where a course meets, and when its next class is.")
    static let openAppWhenRun: Bool = false

    @Parameter(title: "Course", requestValueDialog: IntentDialog("Which class?"))
    var course: CourseEntity

    static var parameterSummary: some ParameterSummary {
        Summary("When is \(\.$course)")
    }

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        guard let c = snap.courses.first(where: { $0.id == course.id }) else {
            return .result(dialog: IntentDialog(stringLiteral: "I couldn't find \(course.name) in Studyboard anymore."))
        }
        let name = SBAsk.courseLabel(c), now = Date()
        let next = snap.classes.first { $0.course == c.id && (SBSay.at($0.date, $0.end) ?? .distantPast) > now }
        var s = ""
        if let times = c.times, !times.isEmpty {
            s = "\(name) meets " + times.replacingOccurrences(of: " · ", with: ", ")
            if let r = c.room, !r.isEmpty { s += ", in " + r }
            s += "."
        }
        if let n = next, let st = SBSay.at(n.date, n.start) {
            let place = (n.place?.isEmpty == false) ? " in " + n.place! : ""
            let kind = (n.kind?.isEmpty == false && n.kind != "Lecture") ? " " + n.kind!.lowercased() : ""
            if st <= now { s += (s.isEmpty ? "" : " ") + "Your \(name)\(kind) is on right now\(place)." }
            else { s += (s.isEmpty ? "" : " ") + "The next \(name)\(kind) is \(SBSay.dayWords(st, now: now)) at \(SBSay.time(st))\(place)." }
        }
        if s.isEmpty { s = "\(name) doesn't have class times in Studyboard. You can add them on the course's page." }
        else if next == nil { s += " There's no class in the next two weeks." }
        return .result(dialog: IntentDialog(stringLiteral: s + SBSay.staleNote(snap, now: now)))
    }
}

// "What's my next class?"
struct NextClassIntent: AppIntent {
    static let title: LocalizedStringResource = "Next Class"
    static let description = IntentDescription("Tells you your next class, when it starts and where.")
    static let openAppWhenRun: Bool = false

    init() {}

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SBAsk.snapshot() else { return .result(dialog: IntentDialog(stringLiteral: SBAsk.noData)) }
        let now = Date(), cs = SBSiriLookup.courses(snap)
        guard let n = snap.classes.first(where: { (SBSay.at($0.date, $0.end) ?? .distantPast) > now }),
              let st = SBSay.at(n.date, n.start), let c = cs[n.course] else {
            return .result(dialog: IntentDialog(stringLiteral: "You don't have any classes in the next two weeks." + SBSay.staleNote(snap, now: now)))
        }
        let name = SBAsk.courseLabel(c)
        let kind = (n.kind?.isEmpty == false && n.kind != "Lecture") ? " " + n.kind!.lowercased() : ""
        let place = (n.place?.isEmpty == false) ? " in " + n.place! : ""
        let s = st <= now
            ? "You're in \(name)\(kind) right now\(place), until \(SBSay.time(SBSay.at(n.date, n.end)!))."
            : "Your next class is \(name)\(kind), \(SBSay.dayWords(st, now: now)) at \(SBSay.time(st))\(place)."
        return .result(dialog: IntentDialog(stringLiteral: s + SBSay.staleNote(snap, now: now)))
    }
}
