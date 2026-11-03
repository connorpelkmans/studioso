// UNTESTED: written without compiler access
// Ask Siri: assignments and courses as App Entities, so Siri can resolve "my bio lab report" or "chem" to the right one, the
// Shortcuts app can offer them, and (iOS 18+) Spotlight's semantic index holds them for the newer Siri.
// They are read from the on-device copy (SBSiriData.swift). Marks and grades are never put into Spotlight.
import AppIntents
import CoreSpotlight
import Foundation

struct AssignmentEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Assignment"
    static var defaultQuery = AssignmentQuery()

    var id: String

    @Property(title: "Title")
    var title: String

    @Property(title: "Course")
    var courseName: String

    @Property(title: "Due Date")
    var dueDate: Date?

    @Property(title: "Done")
    var isDone: Bool

    var displayRepresentation: DisplayRepresentation {
        let due = dueDate.map { SBSay.dayWords($0) } ?? ""
        let sub = [courseName, due.isEmpty ? "" : "due " + due].filter { !$0.isEmpty }.joined(separator: ", ")
        return DisplayRepresentation(title: "\(title)", subtitle: "\(sub)")
    }

    init(task: SBSnapTask, courses: [String: SBSnapCourse]) {
        self.id = task.id
        self.title = task.title
        let c = courses[task.course ?? ""]
        self.courseName = c.map { ($0.code?.isEmpty == false ? $0.code! : $0.name) } ?? ""
        self.dueDate = SBSay.at(task.due, task.time)
        self.isDone = task.done ?? false
    }

    static func all(_ snap: SBSnapshot) -> [AssignmentEntity] {
        let cs = SBSiriLookup.courses(snap)
        return snap.tasks.map { AssignmentEntity(task: $0, courses: cs) }
    }
}

struct AssignmentQuery: EntityStringQuery {
    init() {}

    func entities(for identifiers: [AssignmentEntity.ID]) async throws -> [AssignmentEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        let want = Set(identifiers), cs = SBSiriLookup.courses(snap)
        return snap.tasks.filter { want.contains($0.id) }.map { AssignmentEntity(task: $0, courses: cs) }
    }

    func entities(matching string: String) async throws -> [AssignmentEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        let cs = SBSiriLookup.courses(snap)
        return SBMatch.tasks(snap, string).prefix(10).map { AssignmentEntity(task: $0, courses: cs) }
    }

    // What Siri and Shortcuts offer (and the names Siri listens for in "When is <assignment> due"): open work by due date,
    // then recently marked work. Kept short: every suggestion becomes a spoken phrase variant.
    func suggestedEntities() async throws -> [AssignmentEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        let cs = SBSiriLookup.courses(snap)
        let open = snap.tasks.filter { !($0.done ?? false) }.prefix(25)
        let marked = snap.tasks.filter { ($0.done ?? false) && $0.mark != nil }.prefix(10)
        return (Array(open) + Array(marked)).map { AssignmentEntity(task: $0, courses: cs) }
    }
}

struct CourseEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Course"
    static var defaultQuery = CourseQuery()

    var id: String

    @Property(title: "Name")
    var name: String

    @Property(title: "Code")
    var code: String

    @Property(title: "Class Times")
    var times: String

    var displayRepresentation: DisplayRepresentation {
        let title = code.isEmpty ? name : code
        let sub = [code.isEmpty ? "" : name, times].filter { !$0.isEmpty }.joined(separator: ", ")
        return DisplayRepresentation(title: "\(title)", subtitle: "\(sub)")
    }

    init(course: SBSnapCourse) {
        self.id = course.id
        self.name = course.name
        self.code = course.code ?? ""
        self.times = course.times ?? ""
    }
}

struct CourseQuery: EntityStringQuery {
    init() {}

    func entities(for identifiers: [CourseEntity.ID]) async throws -> [CourseEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        let want = Set(identifiers)
        return snap.courses.filter { want.contains($0.id) }.map { CourseEntity(course: $0) }
    }

    func entities(matching string: String) async throws -> [CourseEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        return SBMatch.courses(snap, string).prefix(10).map { CourseEntity(course: $0) }
    }

    func suggestedEntities() async throws -> [CourseEntity] {
        guard let snap = SBSiriStore.load() else { return [] }
        return snap.courses.prefix(20).map { CourseEntity(course: $0) }
    }
}

enum SBSiriLookup {
    static func courses(_ snap: SBSnapshot) -> [String: SBSnapCourse] {
        Dictionary(snap.courses.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
    }
}

// iOS 18+: the entities go into Spotlight's semantic index, where the newer Siri looks for an app's content.
// verify: IndexedEntity's default attributeSet (from displayRepresentation) and CSSearchableIndex.indexAppEntities /
// deleteAppEntities(ofType:) against the SDK you build with.
@available(iOS 18.0, *)
extension AssignmentEntity: IndexedEntity {}

@available(iOS 18.0, *)
extension CourseEntity: IndexedEntity {}

enum SBSiriIndex {
    // After every new copy: refresh Spotlight and the names Siri listens for in the App Shortcuts phrases
    static func refresh() async {
        if #available(iOS 18.0, *) {
            let index = CSSearchableIndex.default()
            if let snap = SBSiriStore.load() {
                try? await index.deleteAppEntities(ofType: AssignmentEntity.self)
                try? await index.deleteAppEntities(ofType: CourseEntity.self)
                try? await index.indexAppEntities(AssignmentEntity.all(snap))
                try? await index.indexAppEntities(snap.courses.map { CourseEntity(course: $0) })
            } else {
                try? await index.deleteAppEntities(ofType: AssignmentEntity.self)
                try? await index.deleteAppEntities(ofType: CourseEntity.self)
            }
        }
        StudyboardShortcuts.updateAppShortcutParameters()
    }
}
