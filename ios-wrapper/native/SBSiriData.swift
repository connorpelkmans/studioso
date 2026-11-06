// UNTESTED: written without compiler access
// Ask Siri: the copy of tasks, marks, grades and class times the app keeps on this device (src/js/96-siri.js writes it through
// StudyboardSiriDataPlugin), plus the matching and wording the intents in StudyboardAskIntents.swift share.
// The JSON keys here must match siriSnapshot() in 96-siri.js (tests/siri.test.js checks them).
import Foundation

struct SBSnapshot: Codable {
    var v: Int
    var at: Double
    var grades: Bool
    var tasks: [SBSnapTask]
    var courses: [SBSnapCourse]
    var classes: [SBSnapClass]
    // Today's Plan (only for the day it was made) and your focus timer length; missing in copies from older app versions
    var plan: SBSnapPlan?
    var focus: Int?
}

struct SBSnapPlan: Codable {
    var day: String
    var mins: Int
    var done: Int
    var items: [SBSnapPlanItem]
}

struct SBSnapPlanItem: Codable {
    var id: String
    var title: String
    var course: String?
    var mins: Int
}

struct SBSnapMark: Codable {
    var pct: Double?
    var text: String?
    var letter: String?
}

struct SBSnapTask: Codable {
    var id: String
    var title: String
    var course: String?
    var type: String?
    var due: String?
    var time: String?
    var done: Bool?
    var created: Double?
    var doneAt: Double?
    var flag: Bool?
    var mark: SBSnapMark?
}

struct SBSnapGrade: Codable {
    var pct: Double?
    var letter: String?
    var marked: Double?
}

struct SBSnapCourse: Codable {
    var id: String
    var name: String
    var code: String?
    var room: String?
    var times: String?
    var grade: SBSnapGrade?
}

struct SBSnapClass: Codable {
    var course: String
    var kind: String?
    var date: String
    var start: String
    var end: String
    var place: String?

    enum CodingKeys: String, CodingKey {
        case course, kind, date, start, end
        case place = "where"
    }
}

enum SBSiriStore {
    static let fileName = "studyboard-siri.json"
    static let maxBytes = 1_500_000

    // In the App Group container (so a widget could read it later), else the app's own Application Support folder
    static var fileURL: URL? {
        let fm = FileManager.default
        if let g = fm.containerURL(forSecurityApplicationGroupIdentifier: SBCaptureConfig.appGroupID) {
            return g.appendingPathComponent(fileName)
        }
        guard let dir = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent(fileName)
    }

    // Only a copy that decodes is kept. Readable after the first unlock since boot (Siri on a locked phone), never backed up
    @discardableResult
    static func save(_ data: Data) -> Bool {
        guard data.count <= maxBytes, let snap = try? JSONDecoder().decode(SBSnapshot.self, from: data), snap.v == 1,
              var url = fileURL else { return false }
        do {
            try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            var rv = URLResourceValues()
            rv.isExcludedFromBackup = true
            try? url.setResourceValues(rv)
            return true
        } catch {
            return false
        }
    }

    static func load() -> SBSnapshot? {
        guard let url = fileURL, let data = try? Data(contentsOf: url), data.count <= maxBytes else { return nil }
        return try? JSONDecoder().decode(SBSnapshot.self, from: data)
    }

    static func clear() {
        guard let url = fileURL else { return }
        try? FileManager.default.removeItem(at: url)
        SBSiriUpdates.removeAll()
    }

    // A change Siri made shows in Siri's next answer straight away (the app makes the real change when it opens)
    static func apply(_ u: SBSiriUpdate) {
        guard var snap = load(), let i = snap.tasks.firstIndex(where: { $0.id == u.task }) else { return }
        var t = snap.tasks[i]
        if let v = u.title, !v.isEmpty { t.title = v }
        if u.clearDue == true { t.due = ""; t.time = "" }
        else if let d = u.due { t.due = d; if let tm = u.time { t.time = tm } }
        if let d = u.done { t.done = d; t.doneAt = d ? Date().timeIntervalSince1970 * 1000 : 0 }
        if let f = u.flagged { t.flag = f }
        if let c = u.course { t.course = c == "inbox" ? "" : c }
        snap.tasks[i] = t
        if let data = try? JSONEncoder().encode(snap) { save(data) }
    }
}

// Changes Siri made to tasks while the app was closed (iOS 27, StudyboardReminders27.swift). The app applies them when it opens
// (src/js/96-siri.js) and then removes them. Same protection as the copy above.
struct SBSiriUpdate: Codable {
    var id: String = UUID().uuidString
    var task: String
    var title: String? = nil
    var done: Bool? = nil
    var due: String? = nil
    var time: String? = nil
    var clearDue: Bool? = nil
    var flagged: Bool? = nil
    var course: String? = nil
    var at: Double = Date().timeIntervalSince1970 * 1000
}

enum SBSiriUpdates {
    static let fileName = "studyboard-siri-updates.json"
    static let maxItems = 200

    static var fileURL: URL? { SBSiriStore.fileURL?.deletingLastPathComponent().appendingPathComponent(fileName) }

    static func all() -> [SBSiriUpdate] {
        guard let url = fileURL, let data = try? Data(contentsOf: url) else { return [] }
        return (try? JSONDecoder().decode([SBSiriUpdate].self, from: data)) ?? []
    }

    private static func write(_ items: [SBSiriUpdate]) {
        guard let url = fileURL else { return }
        if items.isEmpty { try? FileManager.default.removeItem(at: url); return }
        guard let data = try? JSONEncoder().encode(items) else { return }
        var u = url
        try? data.write(to: u, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        var rv = URLResourceValues()
        rv.isExcludedFromBackup = true
        try? u.setResourceValues(rv)
    }

    static func add(_ u: SBSiriUpdate) {
        var items = all()
        items.append(u)
        write(Array(items.suffix(maxItems)))
    }

    static func remove(ids: [String]) {
        let drop = Set(ids)
        write(all().filter { !drop.contains($0.id) })
    }

    static func removeAll() { write([]) }
}

// Dates and times in the person's own calendar and words
enum SBSay {
    static func day(_ iso: String?) -> Date? {
        guard let s = iso, s.count == 10 else { return nil }
        let p = s.split(separator: "-").compactMap { Int($0) }
        guard p.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: p[0], month: p[1], day: p[2]))
    }

    static func at(_ iso: String?, _ hm: String?) -> Date? {
        guard let d = day(iso) else { return nil }
        guard let t = hm, t.count == 5 else { return d }
        let p = t.split(separator: ":").compactMap { Int($0) }
        guard p.count == 2 else { return d }
        return Calendar.current.date(bySettingHour: p[0], minute: p[1], second: 0, of: d)
    }

    static func time(_ d: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale.current
        f.dateStyle = .none
        f.timeStyle = .short
        return f.string(from: d)
    }

    // "today", "tomorrow", "yesterday", "on Friday", "on Friday, November 14"
    static func dayWords(_ d: Date, now: Date = Date()) -> String {
        let cal = Calendar.current
        let n = cal.dateComponents([.day], from: cal.startOfDay(for: now), to: cal.startOfDay(for: d)).day ?? 0
        if n == 0 { return "today" }
        if n == 1 { return "tomorrow" }
        if n == -1 { return "yesterday" }
        let f = DateFormatter()
        f.locale = Locale.current
        if n > 1 && n < 7 {
            f.setLocalizedDateFormatFromTemplate("EEEE")
        } else {
            f.setLocalizedDateFormatFromTemplate("EEEEMMMMd")
        }
        return "on " + f.string(from: d)
    }

    static func when(_ iso: String?, _ hm: String?, now: Date = Date()) -> String {
        guard let d = at(iso, hm) else { return "" }
        let w = dayWords(d, now: now)
        if let t = hm, t.count == 5 { return w + " at " + time(d) }
        return w
    }

    static func pct(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) + "%" : String(format: "%.1f%%", v)
    }

    // "an A-", "a B+"
    static func letter(_ l: String?) -> String? {
        guard let s = l?.trimmingCharacters(in: .whitespaces), !s.isEmpty else { return nil }
        let an = ["A", "E", "F"].contains(String(s.prefix(1)).uppercased())
        return (an ? "an " : "a ") + s
    }

    static func list(_ parts: [String]) -> String {
        if parts.count <= 1 { return parts.first ?? "" }
        if parts.count == 2 { return parts[0] + " and " + parts[1] }
        return parts.dropLast().joined(separator: ", ") + ", and " + parts.last!
    }

    // Said when the copy is old: what Siri knows is from the last time the app was open
    static func staleNote(_ snap: SBSnapshot, now: Date = Date()) -> String {
        let age = now.timeIntervalSince1970 - snap.at / 1000
        guard snap.at > 0, age > 36 * 3600 else { return "" }
        let days = Int((age / 86400).rounded())
        return " That's from when you last opened Studyboard, \(days) day\(days == 1 ? "" : "s") ago."
    }
}

// Finding what the person named: "bio" finds "BIO 101 Biology", "lab report" finds "Bio lab report"
enum SBMatch {
    static func norm(_ s: String) -> String {
        let folded = s.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
        let kept = folded.unicodeScalars.map { CharacterSet.alphanumerics.contains($0) ? Character($0) : " " }
        return String(kept).split(separator: " ").joined(separator: " ")
    }

    static func score(_ query: String, _ names: [String]) -> Int {
        let q = norm(query)
        guard !q.isEmpty else { return 0 }
        let qWords = q.split(separator: " ").map(String.init)
        var best = 0
        for raw in names {
            let n = norm(raw)
            guard !n.isEmpty else { continue }
            if n == q || n.replacingOccurrences(of: " ", with: "") == q.replacingOccurrences(of: " ", with: "") { return 100 }
            if n.hasPrefix(q) { best = max(best, 90) }
            else if n.contains(q) { best = max(best, 80) }
            let nWords = n.split(separator: " ").map(String.init)
            let hit = qWords.filter { w in nWords.contains { $0 == w || ($0.hasPrefix(w) && w.count >= 3) } }.count
            if hit > 0 { best = max(best, 30 + 50 * hit / max(qWords.count, nWords.count)) }
        }
        return best
    }

    static func courseNames(_ c: SBSnapCourse) -> [String] {
        var out = [c.name]
        if let code = c.code, !code.isEmpty { out.append(code); out.append(code + " " + c.name) }
        return out
    }

    static func courses(_ snap: SBSnapshot, _ q: String) -> [SBSnapCourse] {
        snap.courses.map { ($0, score(q, courseNames($0))) }.filter { $0.1 >= 45 }.sorted { $0.1 > $1.1 }.map { $0.0 }
    }

    static func tasks(_ snap: SBSnapshot, _ q: String) -> [SBSnapTask] {
        let cs = Dictionary(snap.courses.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        return snap.tasks.map { t -> (SBSnapTask, Int) in
            var names = [t.title]
            if let c = cs[t.course ?? ""] { names.append(c.name + " " + t.title); if let code = c.code, !code.isEmpty { names.append(code + " " + t.title) } }
            return (t, score(q, names))
        }.filter { $0.1 >= 45 }.sorted { a, b in
            if a.1 != b.1 { return a.1 > b.1 }
            // same score: open work first, then the nearest due date
            if (a.0.done ?? false) != (b.0.done ?? false) { return !(a.0.done ?? false) }
            return (a.0.due ?? "9999") < (b.0.due ?? "9999")
        }.map { $0.0 }
    }
}
