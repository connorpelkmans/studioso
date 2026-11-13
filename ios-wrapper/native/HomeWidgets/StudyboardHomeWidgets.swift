// UNTESTED: written without compiler access
// Home Screen and Lock Screen widgets for iPhone and iPad:
//   Today (small: Do This Next, medium: Do This Next with Start Focus and the next tasks, large: the whole day, iPad extra large:
//   the day and the week ahead) and Studyboard Lock Screen (rectangular: next task, circular: today's progress, inline: one line).
// They read the day the app saves to the App Group (StudyboardHomeWidgetData.swift). Ticking a task on iOS 17+ marks it done on the
// widget at once and queues it for the app; Start Focus and every other tap open the app (studyboard:// links, native-bridge.js).
// Target: StudyboardWidgets (with StudyboardHomeWidgetData.swift). Listed in the StudyboardWidgets bundle (StudyboardWidgets.swift).
import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Timeline

struct SBWEntry: TimelineEntry {
    let date: Date
    let data: SBWData?
}

struct SBWProvider: TimelineProvider {
    func placeholder(in context: Context) -> SBWEntry { SBWEntry(date: Date(), data: SBWSample.day) }

    func getSnapshot(in context: Context, completion: @escaping (SBWEntry) -> Void) {
        completion(SBWEntry(date: Date(), data: context.isPreview ? (SBWStore.load() ?? SBWSample.day) : SBWStore.load()))
    }

    // Now, when a running Focus ends, and just after midnight (the widget then shows the new day from the week ahead until the
    // app opens). The app asks for a reload whenever the day changes, so nothing else needs scheduling.
    func getTimeline(in context: Context, completion: @escaping (Timeline<SBWEntry>) -> Void) {
        let data = SBWStore.load(), now = Date()
        var dates = [now]
        if let f = data?.focus, f.running, f.endsAt > now.timeIntervalSince1970 * 1000 {
            dates.append(Date(timeIntervalSince1970: f.endsAt / 1000 + 1))
        }
        let cal = Calendar.current
        if let midnight = cal.nextDate(after: now, matching: DateComponents(hour: 0, minute: 0, second: 5), matchingPolicy: .nextTime) {
            dates.append(midnight)
        }
        let entries = dates.sorted().map { SBWEntry(date: $0, data: data) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - What to show

enum SBWMode {
    case setup            // nothing saved yet
    case focus(SBWFocus)
    case exam(SBWExam)
    case overdue
    case day
    case allDone
    case dayOff
    case nothing          // nothing planned today
}

// The day as seen at the entry's time: after midnight, before the app has opened, today's list comes from the week ahead
struct SBWModel {
    let data: SBWData?
    let now: Date

    static func key(_ d: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    var todayKey: String { Self.key(now) }
    // false after midnight until the app saves the new day
    var fresh: Bool { data?.day == todayKey }
    var weekDay: SBWDay? { data?.days?.first(where: { $0.date == todayKey }) }

    var tasks: [SBWTask] {
        guard let d = data else { return [] }
        if fresh { return d.tasks }
        let day = todayKey
        return (weekDay?.items ?? []).map { i in
            SBWTask(id: i.id, title: i.title, course: i.course, color: i.color, meta: SBWFormat.dueLine(day, i.time, today: day),
                    done: false, late: false, due: day, time: i.time, exam: i.exam)
        }
    }
    var open: [SBWTask] { tasks.filter { $0.done != true } }
    var doneCount: Int { tasks.count - open.count }
    var next: SBWNext? {
        guard fresh, let n = data?.next, open.contains(where: { $0.id == n.id }) else {
            return open.first.map { SBWNext(id: $0.id, title: $0.title, course: $0.course, color: $0.color, why: nil, mins: nil, due: $0.due, time: $0.time) }
        }
        return n
    }
    var dayOff: Bool { fresh ? data?.dayOff == true : weekDay?.off == true }
    var focus: SBWFocus? {
        guard let f = data?.focus else { return nil }
        if f.running { return f.endsAt > now.timeIntervalSince1970 * 1000 ? f : nil }
        return f.left > 0 ? f : nil
    }
    var exam: SBWExam? {
        guard let e = data?.exam, let due = e.due, due >= todayKey else { return nil }
        var x = e
        x.days = SBWFormat.daysBetween(todayKey, due)
        return (x.days ?? 99) <= 3 ? x : nil
    }
    // the days after today, for the week view
    var week: [SBWDay] { (data?.days ?? []).filter { $0.date > todayKey } }

    var mode: SBWMode {
        guard data != nil else { return .setup }
        if let f = focus { return .focus(f) }
        if let e = exam { return .exam(e) }
        if open.isEmpty { return !tasks.isEmpty ? .allDone : dayOff ? .dayOff : .nothing }
        if open.contains(where: { $0.late == true }) { return .overdue }
        return .day
    }
    var accent: Color { SBWColor.hex(data?.theme?.accent, SBWColor.blue) }
    var late: Color { SBWColor.hex(data?.theme?.late, SBWColor.red) }
    // the first thing due on a coming day, for "nothing left today" states
    var upcoming: (SBWDay, SBWDayItem)? {
        for d in week { if let i = d.items.first { return (d, i) } }
        return nil
    }
}

// MARK: - Formatting and colours

enum SBWFormat {
    static func date(_ s: String) -> Date? {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX"); f.calendar = Calendar(identifier: .gregorian); f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: s)
    }
    // "23:59" -> "11:59 PM" in the phone's own style
    static func time(_ hhmm: String) -> String? {
        let p = hhmm.split(separator: ":").compactMap { Int($0) }
        guard p.count >= 2, let d = Calendar.current.date(bySettingHour: p[0], minute: p[1], second: 0, of: Date()) else { return nil }
        let f = DateFormatter(); f.dateStyle = .none; f.timeStyle = .short
        return f.string(from: d)
    }
    static func daysBetween(_ a: String, _ b: String) -> Int? {
        guard let x = date(a), let y = date(b) else { return nil }
        return Calendar.current.dateComponents([.day], from: x, to: y).day
    }
    static func weekday(_ s: String, short: Bool = true) -> String {
        guard let d = date(s) else { return s }
        let f = DateFormatter(); f.setLocalizedDateFormatFromTemplate(short ? "EEE d" : "EEEE")
        return f.string(from: d)
    }
    static func mins(_ m: Int?) -> String {
        guard let m = m, m > 0 else { return "" }
        return m >= 60 ? (m % 60 == 0 ? "\(m / 60)h" : "\(m / 60)h \(m % 60)m") : "\(m)m"
    }
    static func dueLine(_ due: String?, _ time: String?, today: String) -> String {
        guard let due = due, !due.isEmpty else { return "" }
        let t = time.flatMap { $0.isEmpty ? nil : self.time($0) }
        if due < today { return "Overdue" }
        if due == today { return t.map { "Due \($0)" } ?? "Due today" }
        if daysBetween(today, due) == 1 { return t.map { "Due tomorrow \($0)" } ?? "Due tomorrow" }
        return "Due " + weekday(due)
    }
}

enum SBWColor {
    static let blue = Color(red: 0.17, green: 0.33, blue: 0.84)
    static let red = Color(red: 0.78, green: 0.21, blue: 0.18)
    static let orange = Color(red: 0.82, green: 0.42, blue: 0.18)
    static let green = Color(red: 0.12, green: 0.54, blue: 0.36)
    static let tomato = Color(red: 0.79, green: 0.35, blue: 0.26)
    static func hex(_ s: String?, _ fallback: Color) -> Color {
        guard let s = s, s.count == 7, s.hasPrefix("#"), let v = UInt64(s.dropFirst(), radix: 16) else { return fallback }
        return Color(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
    }
}

enum SBWLink {
    static func task(_ id: String) -> URL { URL(string: "studyboard://open?task=\(id)") ?? URL(string: "studyboard://action/today")! }
    static func focus(_ id: String) -> URL { URL(string: "studyboard://action/focus?task=\(id)") ?? URL(string: "studyboard://action/focus")! }
    static let today = URL(string: "studyboard://action/today")!
    static let add = URL(string: "studyboard://action/quickadd")!
}

// MARK: - Ticking a task on the widget (iOS 17+)

@available(iOS 17.0, *)
struct SBWCheckOffIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Off Task"
    static var description = IntentDescription("Marks a task done from the Studyboard widget.")
    static var isDiscoverable: Bool = false

    @Parameter(title: "Task ID") var taskID: String

    init() {}
    init(taskID: String) { self.taskID = taskID }

    func perform() async throws -> some IntentResult {
        SBWStore.checkOff(taskID: taskID)
        return .result()
    }
}

// MARK: - Small pieces

private extension View {
    // iOS 17 draws the widget's background itself (and needs to know it, for StandBy and tinted Home Screens)
    // (before iOS 17 a Home Screen widget pads itself; the small Lock Screen ones don't, pad: false)
    @ViewBuilder func sbwBackground(_ c: Color, pad: Bool = true) -> some View {
        if #available(iOSApplicationExtension 17.0, *) { self.containerBackground(c, for: .widget) }
        else if pad { self.padding(16).background(c) }
        else { self }
    }
}

private struct SBWLabel: View {
    let text: String
    var color: Color = .secondary
    var body: some View {
        Text(text.uppercased()).font(.system(size: 11, weight: .bold)).tracking(0.6).foregroundStyle(color).lineLimit(1)
    }
}

private struct SBWCircle: View {
    let task: SBWTask
    var body: some View {
        let c = SBWColor.hex(task.color, .gray)
        let ring = ZStack {
            if task.done == true {
                Circle().fill(SBWColor.green)
                Image(systemName: "checkmark").font(.system(size: 10, weight: .heavy)).foregroundStyle(.white)
            } else {
                Circle().strokeBorder(c, lineWidth: 2)
            }
        }
        .frame(width: 20, height: 20)
        .widgetAccentable()
        if #available(iOSApplicationExtension 17.0, *) {
            if task.done != true {
                Button(intent: SBWCheckOffIntent(taskID: task.id)) { ring.contentShape(Circle()) }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Mark done: \(task.title)")
            } else {
                ring
            }
        } else {
            ring
        }
    }
}

private struct SBWRow: View {
    let task: SBWTask
    let today: String
    var showMeta = true
    var body: some View {
        HStack(spacing: 10) {
            SBWCircle(task: task)
            Link(destination: SBWLink.task(task.id)) {
                HStack(spacing: 6) {
                    Text(task.title).font(.system(size: 14, weight: .semibold)).lineLimit(1)
                        .strikethrough(task.done == true).foregroundStyle(task.done == true ? Color.secondary : Color.primary)
                    Spacer(minLength: 4)
                    if showMeta {
                        let late = task.done != true && task.late == true
                        Text(late ? "Late" : (task.course ?? "")).font(.system(size: 12, weight: late ? .bold : .regular))
                            .foregroundStyle(late ? SBWColor.red : Color.secondary).lineLimit(1)
                    }
                }
            }
        }
    }
}

private struct SBWFocusButton: View {
    let next: SBWNext
    let accent: Color
    var body: some View {
        Link(destination: SBWLink.focus(next.id)) {
            HStack(spacing: 6) {
                Image(systemName: "play.fill").font(.system(size: 11, weight: .bold))
                Text("Start a \(next.mins ?? 25)m Focus").font(.system(size: 13, weight: .semibold)).lineLimit(1)
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(Capsule().fill(accent))
            .foregroundStyle(.white)
        }
        .widgetAccentable()
    }
}

private struct SBWTimer: View {
    let f: SBWFocus
    var size: CGFloat
    var body: some View {
        Group {
            if f.running {
                Text(Date(timeIntervalSince1970: f.endsAt / 1000), style: .timer)
            } else {
                Text(String(format: "%d:%02d", f.left / 60, f.left % 60))
            }
        }
        .font(.system(size: size, weight: .bold, design: .rounded)).monospacedDigit()
    }
}

// MARK: - Today: small (Do This Next)

private struct SBWSmall: View {
    let m: SBWModel
    var body: some View {
        switch m.mode {
        case .setup:
            SBWPrompt(title: "Your day will show up here", sub: "Open Studyboard to start.")
        case .focus(let f):
            VStack(alignment: .leading, spacing: 4) {
                SBWLabel(text: f.mode == "focus" ? "Focus" : "Break", color: SBWColor.tomato)
                SBWTimer(f: f, size: 34)
                Text(f.running ? "left" : "paused").font(.caption).foregroundStyle(.secondary)
                Spacer(minLength: 0)
                if let t = f.task, !t.isEmpty { Text(t).font(.system(size: 14, weight: .semibold)).lineLimit(2).privacySensitive() }
            }.frame(maxWidth: .infinity, alignment: .leading)
        case .exam(let e):
            SBWExamSmall(e: e, accent: m.accent)
        case .allDone:
            SBWAllDone(m: m, compact: true)
        case .dayOff, .nothing:
            SBWFree(m: m, compact: true)
        case .overdue, .day:
            if let n = m.next {
                VStack(alignment: .leading, spacing: 6) {
                    SBWLabel(text: "Do this next" + (n.mins.map { " · " + SBWFormat.mins($0) } ?? ""), color: SBWColor.orange)
                    Text(n.title).font(.system(size: 17, weight: .bold)).lineLimit(3).privacySensitive()
                    if let c = n.course, !c.isEmpty {
                        Text(c).font(.system(size: 11, weight: .bold)).padding(.horizontal, 7).padding(.vertical, 3)
                            .background(Capsule().fill(SBWColor.hex(n.color, .gray).opacity(0.18)))
                            .foregroundStyle(SBWColor.hex(n.color, .gray))
                    }
                    Spacer(minLength: 0)
                    let line = SBWFormat.dueLine(n.due, n.time, today: m.todayKey)
                    if !line.isEmpty { Text(line).font(.caption).foregroundStyle(line == "Overdue" ? SBWColor.red : Color.secondary) }
                }.frame(maxWidth: .infinity, alignment: .leading)
            } else {
                SBWFree(m: m, compact: true)
            }
        }
    }
}

private struct SBWExamSmall: View {
    let e: SBWExam
    let accent: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            SBWLabel(text: "Exam Mode", color: accent)
            Text(e.title).font(.system(size: 14, weight: .semibold)).lineLimit(2).privacySensitive()
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(e.days ?? 0)").font(.system(size: 40, weight: .bold, design: .rounded))
                Text((e.days ?? 0) == 1 ? "day" : (e.days ?? 0) == 0 ? "today" : "days").font(.system(size: 15, weight: .semibold)).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if let r = e.ready {
                Text("Ready \(r)%").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                ProgressView(value: Double(r), total: 100).tint(accent)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct SBWPrompt: View {
    let title: String
    let sub: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: "graduationcap.fill").font(.title2).foregroundStyle(SBWColor.blue).widgetAccentable()
            Spacer(minLength: 0)
            Text(title).font(.system(size: 15, weight: .bold)).lineLimit(3)
            Text(sub).font(.caption).foregroundStyle(.secondary).lineLimit(2)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct SBWAllDone: View {
    let m: SBWModel
    var compact: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: compact ? 26 : 30)).foregroundStyle(SBWColor.green).widgetAccentable()
            SBWLabel(text: "\(m.doneCount) of \(m.tasks.count) done", color: SBWColor.green)
            Text("Today's plan is done!").font(.system(size: compact ? 16 : 18, weight: .bold)).lineLimit(2)
            Spacer(minLength: 0)
            if let u = m.upcoming {
                Text("\(SBWFormat.weekday(u.0.date, short: false)): \(u.1.title)").font(.caption).foregroundStyle(.secondary).lineLimit(2).privacySensitive()
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct SBWFree: View {
    let m: SBWModel
    var compact: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            SBWLabel(text: SBWFormat.weekday(m.todayKey, short: false))
            Text(m.dayOff ? "Day Off" : "Nothing planned").font(.system(size: compact ? 20 : 22, weight: .bold))
            Text(m.dayOff ? "No study time today. Enjoy it." : "A free day so far.").font(.caption).foregroundStyle(.secondary).lineLimit(2)
            Spacer(minLength: 0)
            if let u = m.upcoming {
                Text("\(SBWFormat.weekday(u.0.date, short: false)): \(u.1.title)").font(.caption.weight(.medium)).lineLimit(2).privacySensitive()
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Today: medium

private struct SBWMedium: View {
    let m: SBWModel
    var body: some View {
        switch m.mode {
        case .setup:
            HStack(spacing: 14) {
                Image(systemName: "graduationcap.fill").font(.system(size: 34)).foregroundStyle(m.accent).widgetAccentable()
                VStack(alignment: .leading, spacing: 6) {
                    Text("Your day will show up here").font(.system(size: 16, weight: .bold))
                    Text("Add a task or connect your school site to start.").font(.caption).foregroundStyle(.secondary)
                    Link(destination: SBWLink.add) {
                        Text("Add a Task").font(.system(size: 13, weight: .semibold)).padding(.horizontal, 12).padding(.vertical, 7)
                            .background(Capsule().fill(m.accent)).foregroundStyle(.white)
                    }
                }
                Spacer(minLength: 0)
            }
        case .focus(let f):
            HStack(alignment: .center, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    SBWLabel(text: (f.mode == "focus" ? "Focus" : "Break") + ((f.task ?? "").isEmpty ? "" : " · " + (f.task ?? "")), color: SBWColor.tomato)
                    SBWTimer(f: f, size: 44)
                    Text(f.running ? "left in this session" : "paused").font(.caption).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Link(destination: URL(string: "studyboard://action/focus")!) {
                    Text("Open Timer").font(.system(size: 13, weight: .semibold)).padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Capsule().fill(SBWColor.tomato)).foregroundStyle(.white)
                }
            }
        case .exam(let e):
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    SBWLabel(text: "Exam Mode", color: m.accent)
                    Text(e.title).font(.system(size: 16, weight: .bold)).lineLimit(2).privacySensitive()
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(e.days ?? 0)").font(.system(size: 34, weight: .bold, design: .rounded))
                        Text((e.days ?? 0) == 1 ? "day" : (e.days ?? 0) == 0 ? "today" : "days").font(.system(size: 14, weight: .semibold)).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                    Link(destination: SBWLink.task(e.id)) {
                        Text("Study for It").font(.system(size: 13, weight: .semibold)).padding(.horizontal, 12).padding(.vertical, 7)
                            .background(Capsule().fill(m.accent)).foregroundStyle(.white)
                    }.widgetAccentable()
                }
                Divider()
                VStack(alignment: .leading, spacing: 6) {
                    if let r = e.ready {
                        SBWLabel(text: "Ready")
                        Text("\(r)%").font(.system(size: 22, weight: .bold, design: .rounded))
                        ProgressView(value: Double(r), total: 100).tint(m.accent)
                    }
                    Spacer(minLength: 0)
                    let also = m.open.filter { $0.id != e.id }
                    if let a = also.first {
                        SBWLabel(text: "Also due")
                        Text(a.title).font(.caption).lineLimit(2).privacySensitive()
                    }
                }.frame(width: 120, alignment: .leading)
            }
        case .allDone:
            SBWAllDone(m: m, compact: false)
        case .dayOff, .nothing:
            SBWFree(m: m, compact: false)
        case .overdue, .day:
            SBWList(m: m, rows: 3, header: true)
        }
    }
}

// The list with a header: today's progress, or how much is overdue
private struct SBWList: View {
    let m: SBWModel
    let rows: Int
    var header: Bool
    var body: some View {
        let late = m.open.filter { $0.late == true }
        let shown = Array((late + m.open.filter { $0.late != true } + m.tasks.filter { $0.done == true }).prefix(rows))
        VStack(alignment: .leading, spacing: 0) {
            if header {
                HStack {
                    if !late.isEmpty { SBWLabel(text: "\(late.count) overdue", color: m.late) }
                    else { SBWLabel(text: m.fresh ? "Today's plan" : "Due today") }
                    Spacer()
                    SBWLabel(text: late.isEmpty ? "\(m.doneCount) of \(m.tasks.count) done" : "\(m.open.count - late.count) more today")
                }.padding(.bottom, 6)
            }
            ForEach(shown) { t in
                Divider()
                SBWRow(task: t, today: m.todayKey).padding(.vertical, 6)
            }
            if !m.fresh {
                Spacer(minLength: 0)
                Text("Open Studyboard to plan today").font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Today: large

private struct SBWLarge: View {
    let m: SBWModel
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text(m.fresh ? (m.data?.dateLabel ?? "Today") : SBWFormat.weekday(m.todayKey, short: false)).font(.system(size: 17, weight: .bold)).lineLimit(1)
                Spacer()
                if !m.tasks.isEmpty { SBWLabel(text: "\(m.doneCount) of \(m.tasks.count) done") }
            }
            switch m.mode {
            case .focus, .exam:
                SBWMedium(m: m).frame(height: 120)
                Divider()
                SBWList(m: m, rows: 4, header: false)
            case .setup, .allDone, .dayOff, .nothing:
                SBWMedium(m: m).frame(maxHeight: 150)
                Spacer(minLength: 0)
                SBWWeekList(m: m, days: 3)
            case .overdue, .day:
                if let n = m.next, m.fresh {
                    VStack(alignment: .leading, spacing: 6) {
                        SBWLabel(text: "Do this next" + (n.mins.map { " · " + SBWFormat.mins($0) } ?? ""), color: SBWColor.orange)
                        Link(destination: SBWLink.task(n.id)) {
                            Text(n.title).font(.system(size: 18, weight: .bold)).lineLimit(2).privacySensitive()
                        }
                        Text([n.course, n.why].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                        SBWFocusButton(next: n, accent: m.accent)
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14).fill(SBWColor.orange.opacity(0.10)))
                }
                SBWList(m: m, rows: 5, header: false)
                HStack(spacing: 12) {
                    if let c = m.data?.cards, c > 0 { Label("\(c) cards due", systemImage: "rectangle.on.rectangle").font(.caption) }
                    if let e = m.data?.exam, let d = e.due.flatMap({ SBWFormat.daysBetween(m.todayKey, $0) }), d >= 0 {
                        Label("\(e.title) in \(d) \(d == 1 ? "day" : "days")", systemImage: "graduationcap").font(.caption).lineLimit(1).privacySensitive()
                    }
                }.foregroundStyle(.secondary)
            }
        }
    }
}

// The days after today, one line each
private struct SBWWeekList: View {
    let m: SBWModel
    let days: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(m.week.prefix(days))) { d in
                Divider()
                HStack(alignment: .top, spacing: 10) {
                    Text(SBWFormat.weekday(d.date)).font(.system(size: 12, weight: .bold)).foregroundStyle(.secondary).frame(width: 52, alignment: .leading)
                    Text(d.off == true ? "Day Off" : d.items.isEmpty ? "Nothing due" : d.items.map { $0.title }.joined(separator: " · "))
                        .font(.system(size: 13, weight: d.items.isEmpty ? .regular : .semibold)).foregroundStyle(d.items.isEmpty ? Color.secondary : Color.primary).lineLimit(1).privacySensitive()
                }.padding(.vertical, 6)
            }
        }
    }
}

// MARK: - Today: extra large (iPad)

private struct SBWExtraLarge: View {
    let m: SBWModel
    var body: some View {
        HStack(alignment: .top, spacing: 18) {
            SBWLarge(m: m).frame(maxWidth: .infinity)
            Divider()
            VStack(alignment: .leading, spacing: 10) {
                Text("The Week Ahead").font(.system(size: 17, weight: .bold))
                ForEach(Array(m.week.prefix(5))) { d in
                    let heavy = d.items.count >= 3 || d.items.contains { $0.exam == true }
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(SBWFormat.weekday(d.date)).font(.system(size: 12, weight: .bold)).foregroundStyle(heavy ? m.late : Color.secondary)
                            if heavy { SBWLabel(text: "Heavy", color: m.late) }
                            Spacer()
                        }
                        if d.off == true {
                            Text("Day Off").font(.caption).foregroundStyle(.secondary)
                        } else if d.items.isEmpty {
                            Text("Nothing due").font(.caption).foregroundStyle(.secondary)
                        } else {
                            ForEach(d.items.prefix(2)) { i in
                                Link(destination: SBWLink.task(i.id)) {
                                    HStack(spacing: 6) {
                                        Circle().fill(SBWColor.hex(i.color, .gray)).frame(width: 7, height: 7)
                                        Text(i.title).font(.system(size: 13, weight: i.exam == true ? .bold : .medium)).lineLimit(1).privacySensitive()
                                    }
                                }
                            }
                            if d.items.count + (d.more ?? 0) > 2 { Text("+\(d.items.count + (d.more ?? 0) - 2) more").font(.caption2).foregroundStyle(.secondary) }
                        }
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 10).fill(heavy ? m.late.opacity(0.10) : Color.primary.opacity(0.04)))
                }
                Spacer(minLength: 0)
            }.frame(maxWidth: .infinity)
        }
    }
}

// MARK: - Today widget

struct SBWTodayView: View {
    @Environment(\.widgetFamily) var family
    let entry: SBWEntry
    var body: some View {
        let m = SBWModel(data: entry.data, now: entry.date)
        Group {
            switch family {
            case .systemSmall: SBWSmall(m: m)
            case .systemMedium: SBWMedium(m: m)
            case .systemLarge: SBWLarge(m: m)
            case .systemExtraLarge: SBWExtraLarge(m: m)
            default: SBWSmall(m: m)
            }
        }
        .widgetURL(family == .systemSmall ? (m.next.map { SBWLink.task($0.id) } ?? SBWLink.today) : SBWLink.today)
        .sbwBackground(Color(UIColor.secondarySystemBackground))
    }
}

struct StudyboardTodayWidget: Widget {
    let kind = "StudyboardToday"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SBWProvider()) { entry in
            SBWTodayView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Do This Next and the rest of today's plan. Tick tasks off right on the widget.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge])
    }
}

// MARK: - Lock Screen

struct SBWLockView: View {
    @Environment(\.widgetFamily) var family
    let entry: SBWEntry
    var body: some View {
        let m = SBWModel(data: entry.data, now: entry.date)
        Group {
            switch family {
            case .accessoryCircular:
                if case .focus(let f) = m.mode {
                    VStack(spacing: 0) {
                        Image(systemName: "timer").font(.caption2)
                        SBWTimer(f: f, size: 13)
                    }
                } else if m.tasks.isEmpty {
                    Image(systemName: m.dayOff ? "sun.max" : "graduationcap").font(.title2)
                } else {
                    Gauge(value: Double(m.doneCount), in: 0...Double(max(1, m.tasks.count))) {
                        Image(systemName: "checkmark")
                    } currentValueLabel: {
                        Text("\(m.doneCount)/\(m.tasks.count)")
                    }
                    .gaugeStyle(.accessoryCircularCapacity)
                }
            case .accessoryInline:
                Text(inline(m))
            default:
                rectangular(m)
            }
        }
        .widgetURL(m.next.map { SBWLink.task($0.id) } ?? SBWLink.today)
        .sbwBackground(Color.clear, pad: false)
    }

    private func inline(_ m: SBWModel) -> String {
        if case .focus(let f) = m.mode { return f.mode == "focus" ? "Focusing" : "On a break" }
        if let e = m.exam, let d = e.days { return d == 0 ? "\(e.title) today" : "\(e.title) in \(d) \(d == 1 ? "day" : "days")" }
        if m.tasks.isEmpty { return m.dayOff ? "Day Off" : "Nothing planned today" }
        return m.open.isEmpty ? "Today's plan is done" : "\(m.open.count) \(m.open.count == 1 ? "task" : "tasks") left today"
    }

    @ViewBuilder private func rectangular(_ m: SBWModel) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            switch m.mode {
            case .focus(let f):
                Text(f.mode == "focus" ? "FOCUS" : "BREAK").font(.system(size: 11, weight: .bold))
                SBWTimer(f: f, size: 22)
                if let t = f.task, !t.isEmpty { Text(t).font(.caption).lineLimit(1).privacySensitive() }
            case .exam(let e):
                Text("EXAM MODE").font(.system(size: 11, weight: .bold))
                Text(e.title).font(.headline).lineLimit(1).privacySensitive()
                Text((e.days ?? 0) == 0 ? "Today" : "In \(e.days ?? 0) \((e.days ?? 0) == 1 ? "day" : "days")" + (e.ready.map { " · ready \($0)%" } ?? "")).font(.caption)
            case .setup:
                Text("Studyboard").font(.headline)
                Text("Open the app to see your day").font(.caption).lineLimit(2)
            case .allDone, .dayOff, .nothing:
                Text(m.tasks.isEmpty ? (m.dayOff ? "DAY OFF" : "TODAY") : "ALL DONE").font(.system(size: 11, weight: .bold))
                Text(m.tasks.isEmpty ? "Nothing planned" : "Today's plan is done").font(.headline).lineLimit(1)
                if let u = m.upcoming { Text("\(SBWFormat.weekday(u.0.date)): \(u.1.title)").font(.caption).lineLimit(1).privacySensitive() }
            case .overdue, .day:
                if let n = m.next {
                    Text("NEXT" + (n.mins.map { " · " + SBWFormat.mins($0) } ?? "")).font(.system(size: 11, weight: .bold))
                    Text(n.title).font(.headline).lineLimit(1).privacySensitive()
                    Text([SBWFormat.dueLine(n.due, n.time, today: m.todayKey), "\(m.open.count) left"].filter { !$0.isEmpty }.joined(separator: " · ")).font(.caption).lineLimit(1)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct StudyboardLockWidget: Widget {
    let kind = "StudyboardLock"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SBWProvider()) { entry in
            SBWLockView(entry: entry)
        }
        .configurationDisplayName("Up Next")
        .description("Your next task, today's progress, or the next exam. Task names stay hidden while the phone is locked.")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}

// MARK: - The widget gallery's sample day

enum SBWSample {
    static var day: SBWData {
        let today = SBWModel.key(Date())
        let tomorrow = SBWModel.key(Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date())
        return SBWData(v: 1, day: today, at: Date().timeIntervalSince1970 * 1000, dateLabel: "Today",
                       next: SBWNext(id: "s1", title: "Discussion Post 4", course: "ENGL 1100", color: "#D06A2E", why: "Due tonight", mins: 60, due: today, time: "23:59"),
                       tasks: [SBWTask(id: "s0", title: "Read chapter 4", course: "HIST", color: "#8E5BD0", meta: "Done", done: true, late: false, due: today, time: nil, exam: false),
                               SBWTask(id: "s1", title: "Discussion Post 4", course: "ENGL 1100", color: "#D06A2E", meta: "Due 11:59 PM", done: false, late: false, due: today, time: "23:59", exam: false),
                               SBWTask(id: "s2", title: "Study for Chapter 6 Quiz", course: "PSYC 1010", color: "#3A6FD8", meta: "30m today", done: false, late: false, due: tomorrow, time: nil, exam: false),
                               SBWTask(id: "s3", title: "Lab report draft", course: "BIO 1010", color: "#2A9D8F", meta: "45m today", done: false, late: false, due: nil, time: nil, exam: false)],
                       more: 0, cards: 24, dayOff: false, exam: nil, focus: nil,
                       days: [SBWDay(date: tomorrow, off: false, items: [SBWDayItem(id: "s4", title: "Chapter 6 Quiz", course: "PSYC 1010", color: "#3A6FD8", time: "09:00", exam: true)], more: 0)],
                       theme: SBWTheme(accent: "#2C55D6", accentInk: "#FFFFFF", late: "#C8352E"))
    }
}
