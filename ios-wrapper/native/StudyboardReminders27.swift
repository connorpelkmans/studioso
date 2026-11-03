// UNTESTED: written without compiler access, from Xcode 27.2's own schema errors (tried in a scratch project, see VOICE-CAPTURE-NATIVE.md)
// iOS 27: Studyboard's tasks as Apple's Reminders App Schema, so the new Siri understands them in your own words:
//   tasks -> .reminders.reminder, courses -> .reminders.list (tasks with no course: an "Inbox" list),
//   "add read chapter 4 to Studyboard for Friday" -> .reminders.createReminder,
//   "mark my lab report done", "move the essay to Monday" -> .reminders.updateReminder.
// Questions ("is my bio lab due soon?") are answered by Siri from these entities in the semantic index; there is no "find" schema.
// Older iOS keeps StudyboardEntities.swift / StudyboardAskIntents.swift. Everything here is iOS 27 only, as separate types,
// because the schema needs types (GeoToolbox.PlaceDescriptor) older iOS doesn't have.
// Studyboard has no sections, place reminders, repeats, tags, links or images on tasks: those schema fields are there because
// Apple requires them, and are left empty or ignored.
import AppIntents
import Foundation
import GeoToolbox

// MARK: Enums the schema requires

@available(iOS 27.0, *)
@AppEnum(schema: .reminders.listType)
enum SBListType: String {
    case standard
}

@available(iOS 27.0, *)
@AppEnum(schema: .reminders.locationTriggerEvent)
enum SBPlaceEvent: String {
    case arrive
    case depart
}

// MARK: Course = list

@available(iOS 27.0, *)
@AppEntity(schema: .reminders.list)
struct SBCourseList {
    static let defaultQuery = SBCourseListQuery()
    static let inboxID = "inbox"

    var id: String
    var name: String
    var type: SBListType

    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(name)") }

    init(id: String, name: String) {
        self.id = id
        self.name = name
        self.type = .standard
    }

    // "BIO 101 Biology", so Siri hears both the code and the name
    init(course c: SBSnapCourse) {
        let code = c.code ?? ""
        self.init(id: c.id, name: code.isEmpty || c.name.localizedCaseInsensitiveContains(code) ? c.name : code + " " + c.name)
    }

    static var inbox: SBCourseList { SBCourseList(id: inboxID, name: "Inbox") }

    static func all(_ snap: SBSnapshot) -> [SBCourseList] { [inbox] + snap.courses.map { SBCourseList(course: $0) } }
}

@available(iOS 27.0, *)
extension SBCourseList: IndexedEntity {}

@available(iOS 27.0, *)
struct SBCourseListQuery: EntityStringQuery {
    init() {}

    func entities(for identifiers: [String]) async throws -> [SBCourseList] {
        guard let snap = SBSiriStore.load() else { return identifiers.contains(SBCourseList.inboxID) ? [.inbox] : [] }
        let want = Set(identifiers)
        return SBCourseList.all(snap).filter { want.contains($0.id) }
    }

    func entities(matching string: String) async throws -> [SBCourseList] {
        guard let snap = SBSiriStore.load() else { return [] }
        var out = SBMatch.courses(snap, string).prefix(10).map { SBCourseList(course: $0) }
        if SBMatch.score(string, ["Inbox", "No course"]) >= 80 { out.append(.inbox) }
        return out
    }

    func suggestedEntities() async throws -> [SBCourseList] {
        guard let snap = SBSiriStore.load() else { return [] }
        return Array(SBCourseList.all(snap).prefix(21))
    }
}

// MARK: Required by the schema, not used by Studyboard (no sections, no place reminders)

@available(iOS 27.0, *)
@AppEntity(schema: .reminders.section)
struct SBCourseSection {
    static let defaultQuery = SBCourseSectionQuery()
    var id: String
    var name: String
    var list: SBCourseList
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(name)") }
}

@available(iOS 27.0, *)
struct SBCourseSectionQuery: EntityStringQuery {
    init() {}
    func entities(for identifiers: [String]) async throws -> [SBCourseSection] { [] }
    func entities(matching string: String) async throws -> [SBCourseSection] { [] }
}

@available(iOS 27.0, *)
@AppEntity(schema: .reminders.locationTrigger)
struct SBPlaceTrigger {
    static let defaultQuery = SBPlaceTriggerQuery()
    var id: String
    var event: SBPlaceEvent
    var place: PlaceDescriptor
    var displayRepresentation: DisplayRepresentation { "Location" }
}

@available(iOS 27.0, *)
struct SBPlaceTriggerQuery: EntityStringQuery {
    init() {}
    func entities(for identifiers: [String]) async throws -> [SBPlaceTrigger] { [] }
    func entities(matching string: String) async throws -> [SBPlaceTrigger] { [] }
}

// MARK: Task = reminder

@available(iOS 27.0, *)
@AppEntity(schema: .reminders.reminder)
struct SBTaskReminder {
    static let defaultQuery = SBTaskReminderQuery()

    var id: String
    var title: String
    var note: AttributedString?
    var dueDate: DateComponents?
    var completionDate: Date?
    var creationDate: Date?
    var isCompleted: Bool
    var isFlagged: Bool?
    var list: SBCourseList
    var locationTrigger: SBPlaceTrigger?
    var recurrence: Calendar.RecurrenceRule?
    var tags: Set<String>
    var urls: [URL]

    var displayRepresentation: DisplayRepresentation {
        let due = SBRemind.date(dueDate).map { "due " + SBSay.dayWords($0) } ?? ""
        let sub = [list.id == SBCourseList.inboxID ? "" : list.name, due].filter { !$0.isEmpty }.joined(separator: ", ")
        return DisplayRepresentation(title: "\(title)", subtitle: "\(sub)")
    }

    init(id: String, title: String, due: DateComponents?, done: Bool, doneAt: Date?, created: Date?, flagged: Bool, list: SBCourseList, kind: String?) {
        self.id = id
        self.title = title
        self.note = nil
        self.dueDate = due
        self.completionDate = doneAt
        self.creationDate = created
        self.isCompleted = done
        self.isFlagged = flagged
        self.list = list
        self.locationTrigger = nil
        self.recurrence = nil
        // the task's type (Exam, Lab, Reading...) as a tag, so "my exams" means something to Siri
        self.tags = kind.map { $0.isEmpty ? [] : [$0] } ?? []
        self.urls = []
    }

    init(task t: SBSnapTask, lists: [String: SBCourseList]) {
        let ms: (Double?) -> Date? = { v in
            guard let x = v, x > 0 else { return nil }
            return Date(timeIntervalSince1970: x / 1000)
        }
        self.init(id: t.id, title: t.title, due: SBRemind.components(t.due, t.time), done: t.done ?? false, doneAt: ms(t.doneAt),
                  created: ms(t.created), flagged: t.flag ?? false, list: lists[t.course ?? ""] ?? .inbox, kind: t.type)
    }

    static func lists(_ snap: SBSnapshot) -> [String: SBCourseList] {
        Dictionary(snap.courses.map { ($0.id, SBCourseList(course: $0)) }, uniquingKeysWith: { a, _ in a })
    }

    static func all(_ snap: SBSnapshot) -> [SBTaskReminder] {
        let ls = lists(snap)
        return snap.tasks.map { SBTaskReminder(task: $0, lists: ls) }
    }
}

// In the semantic index, which is where the new Siri looks up an app's content. Marks and grades are not part of it.
@available(iOS 27.0, *)
extension SBTaskReminder: IndexedEntity {}

@available(iOS 27.0, *)
struct SBTaskReminderQuery: EntityStringQuery {
    init() {}

    func entities(for identifiers: [String]) async throws -> [SBTaskReminder] {
        guard let snap = SBSiriStore.load() else { return [] }
        let want = Set(identifiers), ls = SBTaskReminder.lists(snap)
        return snap.tasks.filter { want.contains($0.id) }.map { SBTaskReminder(task: $0, lists: ls) }
    }

    func entities(matching string: String) async throws -> [SBTaskReminder] {
        guard let snap = SBSiriStore.load() else { return [] }
        let ls = SBTaskReminder.lists(snap)
        return SBMatch.tasks(snap, string).prefix(10).map { SBTaskReminder(task: $0, lists: ls) }
    }

    func suggestedEntities() async throws -> [SBTaskReminder] {
        guard let snap = SBSiriStore.load() else { return [] }
        let ls = SBTaskReminder.lists(snap)
        return snap.tasks.filter { !($0.done ?? false) }.prefix(30).map { SBTaskReminder(task: $0, lists: ls) }
    }
}

// MARK: Dates between Studyboard ("2026-11-07", "17:00") and Siri (DateComponents: "Friday", "tomorrow at 5")

enum SBRemind {
    static func components(_ due: String?, _ time: String?) -> DateComponents? {
        guard let d = SBSay.day(due) else { return nil }
        let cal = Calendar.current
        var c = cal.dateComponents([.year, .month, .day], from: d)
        if let at = SBSay.at(due, time), time?.count == 5 {
            let hm = cal.dateComponents([.hour, .minute], from: at)
            c.hour = hm.hour
            c.minute = hm.minute
        }
        return c
    }

    // A day and an optional time, in the person's own calendar. Components without a full date ("Friday") mean the next one.
    static func dayAndTime(_ c: DateComponents?) -> (day: String, time: String?)? {
        guard let c = c else { return nil }
        let cal = Calendar.current
        let date: Date?
        if let y = c.year, let m = c.month, let d = c.day {
            date = cal.date(from: DateComponents(year: y, month: m, day: d))
        } else {
            var only = DateComponents()
            only.weekday = c.weekday
            only.day = c.day
            only.month = c.month
            date = (only.weekday == nil && only.day == nil && only.month == nil) ? cal.startOfDay(for: Date())
                : cal.nextDate(after: Date(), matching: only, matchingPolicy: .nextTime)
        }
        guard let day = date else { return nil }
        let ymd = cal.dateComponents([.year, .month, .day], from: day)
        guard let y = ymd.year, let m = ymd.month, let d = ymd.day else { return nil }
        let iso = String(format: "%04d-%02d-%02d", y, m, d)
        if let h = c.hour { return (iso, String(format: "%02d:%02d", h, c.minute ?? 0)) }
        return (iso, nil)
    }

    static func date(_ c: DateComponents?) -> Date? {
        guard let dt = dayAndTime(c) else { return nil }
        return SBSay.at(dt.day, dt.time)
    }
}

// MARK: "Add read chapter 4 to Studyboard for Friday"

@available(iOS 27.0, *)
@AppIntent(schema: .reminders.createReminder)
struct SBCreateReminderIntent {
    static let title: LocalizedStringResource = "Add Task"

    @Parameter var title: String
    @Parameter var note: AttributedString?
    @Parameter var dueDate: DateComponents?
    @Parameter var isFlagged: Bool?
    @Parameter var list: SBCourseList?
    @Parameter var section: SBCourseSection?
    @Parameter var locationTrigger: SBPlaceTrigger?
    @Parameter var recurrence: Calendar.RecurrenceRule?
    @Parameter var tags: Set<String>
    @Parameter var urls: [URL]
    // verify: the exact label Xcode wants here (its error named 'supportedTypeIdentifiers' with a 'public.image' subtype)
    @Parameter(supportedTypeIdentifiers: ["public.image"]) var images: [IntentFile]

    func perform() async throws -> some IntentResult & ReturnsValue<SBTaskReminder> & ProvidesDialog {
        let dt = SBRemind.dayAndTime(dueDate)
        let due = dt.map { $0.time.map { t in $0.day + "T" + t } ?? $0.day }
        // the course goes as a hint the app matches against your courses (its code, else its name)
        var hint: String? = nil
        if let l = list, l.id != SBCourseList.inboxID {
            let c = SBSiriStore.load()?.courses.first { $0.id == l.id }
            hint = c.map { ($0.code?.isEmpty == false ? $0.code! : $0.name) } ?? l.name
        }
        let item = PendingCapture(text: title, due: due, course: hint, source: "siri")
        let made = SBTaskReminder(id: "new-" + item.id, title: title, due: SBRemind.components(dt?.day, dt?.time), done: false, doneAt: nil,
                                  created: Date(), flagged: isFlagged ?? false, list: list ?? .inbox, kind: nil)
        guard let clean = item.sanitized() else {
            return .result(value: made, dialog: IntentDialog("I didn't catch a task. Try again."))
        }
        let when = dt.map { " " + SBSay.when($0.day, $0.time) } ?? ""
        do {
            _ = try await SBCapture.send(clean)
            return .result(value: made, dialog: IntentDialog(stringLiteral: "Added \(title) to Studyboard\(when.isEmpty ? "" : ", due" + when)."))
        } catch {
            SBCapture.enqueue(clean)
            return .result(value: made, dialog: IntentDialog(stringLiteral: "Got it. \(title) will be on your board the next time you open Studyboard."))
        }
    }
}

// MARK: "Mark my lab report done", "move the essay to Monday", "flag the bio quiz"

@available(iOS 27.0, *)
@AppIntent(schema: .reminders.updateReminder)
struct SBUpdateReminderIntent {
    static let title: LocalizedStringResource = "Change Task"

    @Parameter var target: SBTaskReminder
    @Parameter var title: String?
    @Parameter var note: AttributedString?
    @Parameter var dueDate: DateComponents?
    @Parameter var isCompleted: Bool?
    @Parameter var isFlagged: Bool?
    @Parameter var list: SBCourseList?
    @Parameter var locationTrigger: SBPlaceTrigger?
    @Parameter var recurrence: Calendar.RecurrenceRule?
    @Parameter var tags: Set<String>?
    @Parameter var urls: [URL]?

    func perform() async throws -> some IntentResult & ReturnsValue<SBTaskReminder> & ProvidesDialog {
        // a task Siri only just added has no Studyboard id yet
        guard !target.id.hasPrefix("new-") else {
            return .result(value: target, dialog: IntentDialog("Open Studyboard once so that task is on your board, then try again."))
        }
        var u = SBSiriUpdate(task: target.id)
        var said: [String] = []
        if let t = title?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty, t != target.title { u.title = String(t.prefix(200)); said.append("renamed it to \(t)") }
        if let dt = SBRemind.dayAndTime(dueDate) { u.due = dt.day; u.time = dt.time; said.append("moved it to \(SBSay.when(dt.day, dt.time))") }
        if let c = isCompleted { u.done = c; said.append(c ? "marked it done" : "marked it not done") }
        if let f = isFlagged { u.flagged = f; said.append(f ? "made it high priority" : "took it off high priority") }
        if let l = list, l.id != target.list.id { u.course = l.id; said.append("moved it to \(l.id == SBCourseList.inboxID ? "no course" : l.name)") }
        if said.isEmpty {
            return .result(value: target, dialog: IntentDialog("Studyboard can change a task's name, due date, done, priority or course."))
        }
        SBSiriUpdates.add(u)
        SBSiriStore.apply(u)
        let now = (try? await SBTaskReminderQuery().entities(for: [target.id]).first) ?? target
        let line = "For \(target.title), I " + SBSay.list(said) + ". Studyboard will sync it the next time it's open."
        return .result(value: now, dialog: IntentDialog(stringLiteral: line))
    }
}
