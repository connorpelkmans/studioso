// UNTESTED: written without compiler access
// The day the Home Screen and Lock Screen widgets show, and the tasks checked off on them. Shared by the App target (the plugin writes
// the day the page sends) and the StudyboardWidgets target (the widgets read it, and a check-off writes to it), through the App Group.
// Targets: App AND StudyboardWidgets.
import Foundation

struct SBWTask: Codable, Hashable, Identifiable {
    var id: String
    var title: String
    var course: String?
    var color: String?
    var meta: String?
    var done: Bool?
    var late: Bool?
    var due: String?
    var time: String?
    var exam: Bool?
}

struct SBWNext: Codable, Hashable {
    var id: String
    var title: String
    var course: String?
    var color: String?
    var why: String?
    var mins: Int?
    var due: String?
    var time: String?
}

struct SBWExam: Codable, Hashable {
    var id: String
    var title: String
    var course: String?
    var color: String?
    var due: String?
    var time: String?
    var days: Int?
    var ready: Int?
}

struct SBWFocus: Codable, Hashable {
    var mode: String      // "focus" or "break"
    var running: Bool
    var endsAt: Double    // ms since 1970, while running
    var left: Int         // seconds, while paused
    var task: String?
}

struct SBWDayItem: Codable, Hashable, Identifiable {
    var id: String
    var title: String
    var course: String?
    var color: String?
    var time: String?
    var exam: Bool?
}

struct SBWDay: Codable, Hashable, Identifiable {
    var date: String      // yyyy-MM-dd
    var off: Bool?
    var items: [SBWDayItem]
    var more: Int?
    var id: String { date }
}

struct SBWTheme: Codable, Hashable {
    var accent: String?
    var accentInk: String?
    var late: String?
}

// What src/js/70-widgets.js phoneData() sends (v 1)
struct SBWData: Codable, Hashable {
    var v: Int
    var day: String       // yyyy-MM-dd the list is for
    var at: Double        // ms since 1970 it was made
    var dateLabel: String?
    var next: SBWNext?
    var tasks: [SBWTask]
    var more: Int?
    var cards: Int?
    var dayOff: Bool?
    var exam: SBWExam?
    var focus: SBWFocus?
    var days: [SBWDay]?
    var theme: SBWTheme?
}

// A task checked off on a widget, waiting for the app to do it (StudyboardNative.homeWidgets.drain in the page)
struct SBWAction: Codable, Hashable {
    var id: String
    var kind: String      // "done"
    var task: String
    var at: Double        // ms since 1970
}

enum SBWStore {
    static let appGroupID = "group.com.studyboardapp.studyboard"
    private static var dir: URL? { FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) }
    private static var dataURL: URL? { dir?.appendingPathComponent("widget-today.json") }
    private static var actionsURL: URL? { dir?.appendingPathComponent("widget-actions.json") }

    static func load() -> SBWData? {
        guard let u = dataURL, let raw = try? Data(contentsOf: u) else { return nil }
        return try? JSONDecoder().decode(SBWData.self, from: raw)
    }

    // Only a day that decodes is kept, so a bad write can't leave the widgets blank
    @discardableResult
    static func save(_ raw: Data) -> Bool {
        guard raw.count < 400_000, let d = try? JSONDecoder().decode(SBWData.self, from: raw), d.v == 1 else { return false }
        return write(raw, to: dataURL)
    }

    static func clear() {
        if let u = dataURL { try? FileManager.default.removeItem(at: u) }
        if let u = actionsURL { try? FileManager.default.removeItem(at: u) }
    }

    static func actions() -> [SBWAction] {
        guard let u = actionsURL, let raw = try? Data(contentsOf: u) else { return [] }
        return (try? JSONDecoder().decode([SBWAction].self, from: raw)) ?? []
    }

    static func removeActions(ids: [String]) {
        let drop = Set(ids)
        coordinated(actionsURL) { list in list.filter { !drop.contains($0.id) } }
    }

    // A tick on the widget: it shows as done straight away (the saved day is changed here), and waits in the queue until the app
    // does it for real and syncs it
    static func checkOff(taskID: String) {
        guard taskID.range(of: "^[A-Za-z0-9_:.-]{1,80}$", options: .regularExpression) != nil else { return }
        let now = Date().timeIntervalSince1970 * 1000
        coordinated(actionsURL) { list in
            if list.contains(where: { $0.task == taskID && $0.kind == "done" }) { return list }
            return Array((list + [SBWAction(id: UUID().uuidString, kind: "done", task: taskID, at: now)]).suffix(100))
        }
        guard var d = load() else { return }
        var changed = false
        for i in d.tasks.indices where d.tasks[i].id == taskID && d.tasks[i].done != true {
            d.tasks[i].done = true
            d.tasks[i].late = false
            changed = true
        }
        if d.next?.id == taskID {
            // the next task on the list takes its place until the app works out the plan again
            d.next = d.tasks.first(where: { $0.done != true }).map { SBWNext(id: $0.id, title: $0.title, course: $0.course, color: $0.color, why: nil, mins: nil, due: $0.due, time: $0.time) }
            changed = true
        }
        if changed, let raw = try? JSONEncoder().encode(d) { write(raw, to: dataURL) }
    }

    @discardableResult
    private static func write(_ raw: Data, to url: URL?) -> Bool {
        guard let url = url else { return false }
        var ok = false, err: NSError?
        NSFileCoordinator(filePresenter: nil).coordinate(writingItemAt: url, options: .forReplacing, error: &err) { u in
            ok = (try? raw.write(to: u, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])) != nil
        }
        return ok && err == nil
    }

    // Read, change and write the queue as one step, so the app and a widget never overwrite each other's changes
    private static func coordinated(_ url: URL?, _ change: ([SBWAction]) -> [SBWAction]) {
        guard let url = url else { return }
        var err: NSError?
        NSFileCoordinator(filePresenter: nil).coordinate(writingItemAt: url, options: .forMerging, error: &err) { u in
            let now = (try? Data(contentsOf: u)).flatMap { try? JSONDecoder().decode([SBWAction].self, from: $0) } ?? []
            let next = change(now)
            if next == now { return }
            if let raw = try? JSONEncoder().encode(next) { try? raw.write(to: u, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]) }
        }
    }
}
