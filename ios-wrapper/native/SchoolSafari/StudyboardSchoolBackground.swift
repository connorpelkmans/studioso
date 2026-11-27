// UNTESTED: written without compiler access or a device
// App target only. School sites while Studyboard is in the background (ios-wrapper/README-IOS.md, "School sites in the background"):
//
//  1. A quick check (Background App Refresh, about 20 seconds; iOS decides how often): with the app's own sign-in, asks the school
//     site's API what's due and what's been graded, without a web view (iOS may pause those in the background). New work and new
//     grades become notifications; the request itself keeps the school's sign-in from timing out.
//  2. A full sync (a background processing task: minutes, usually while the phone is idle, often charging): the page's normal
//     sync, the same as Sync Now (window.__sbSchoolSync, src/js/95-lms.js).
//  3. A school that has signed the student out: one notification. Tapping it reconnects: a school that signs in with Google opens
//     straight in Safari (which often still remembers the student; the Safari extension hands the sign-in back), any other school
//     opens the app's own sign-in.
//
// MainViewController's StudyboardBackgroundRefresh.register() calls register() here by name, so the app still builds without this file.
import Foundation
import UIKit
import WebKit
import BackgroundTasks
import UserNotifications
import Capacitor

// The school sites this iPhone is signed in to (kept by StudyboardLms.swift), with the student's choices from the page
enum SBSchools {
    struct Entry: Codable { var origin: String; var auto: Bool; var alerts: Bool; var needLogin: Bool; var loginNoticeAt: Double }
    private static let key = "sbSchoolsConnected"
    static func all() -> [String: Entry] {
        guard let d = UserDefaults.standard.data(forKey: key), let m = try? JSONDecoder().decode([String: Entry].self, from: d) else { return [:] }
        return m.filter { SBSchoolHandoff.platforms.contains($0.key) && SBSchoolHandoff.origin(of: $0.value.origin) != nil }
    }
    private static func save(_ m: [String: Entry]) { if let d = try? JSONEncoder().encode(m) { UserDefaults.standard.set(d, forKey: key) } }
    static func connected(_ id: String, origin: String) {
        guard SBSchoolHandoff.platforms.contains(id), SBSchoolHandoff.origin(of: origin) != nil else { return }
        var m = all()
        let was = m[id]
        m[id] = Entry(origin: origin, auto: was?.auto ?? true, alerts: was?.alerts ?? true, needLogin: false, loginNoticeAt: 0)
        save(m)
        if was == nil || was?.origin != origin { UserDefaults.standard.removeObject(forKey: SBSchoolCheck.seenKey + id) }
        if was?.needLogin == true { UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["sb-school-login-" + id]) }
        StudyboardSchoolBackground.schedule()
    }
    static func markNeedLogin(_ id: String, _ need: Bool) {
        var m = all(); guard var e = m[id] else { return }
        e.needLogin = need; m[id] = e; save(m)
    }
    static func setPrefs(_ id: String, auto: Bool, alerts: Bool) {
        var m = all(); guard var e = m[id] else { return }
        e.auto = auto; e.alerts = alerts; m[id] = e; save(m)
    }
    static func noticed(_ id: String) {
        var m = all(); guard var e = m[id] else { return }
        e.loginNoticeAt = Date().timeIntervalSince1970; m[id] = e; save(m)
    }
    static func remove(_ id: String) {
        var m = all(); m.removeValue(forKey: id); save(m)
        UserDefaults.standard.removeObject(forKey: SBSchoolCheck.seenKey + id)
    }
}

// 1. The quick check
enum SBSchoolCheck {
    static let seenKey = "sbSchoolSeen."
    struct Item { let key: String; let title: String; let course: String; let due: Date?; let graded: Bool }
    enum Outcome { case items([Item]), needLogin, unknown }
    struct Seen: Codable { var items: [String]; var graded: [String] }

    // Requests stay on the school's own site: a redirect anywhere else (its sign-in, Google's) is stopped and means "signed out"
    final class SameSite: NSObject, URLSessionTaskDelegate {
        let host: String
        init(host: String) { self.host = host }
        func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
            completionHandler(request.url?.host?.lowercased() == host && request.url?.scheme == "https" ? request : nil)
        }
    }

    @available(iOS 15.0, *)
    final class Site {
        let id: String, origin: String, session: URLSession, jar: HTTPCookieStorage
        init?(id: String, origin: String) {
            guard let snap = SBSchoolHandoff.snapshot(id, origin: origin), let base = URL(string: origin + "/"), let host = base.host?.lowercased() else { return nil }
            let cfg = URLSessionConfiguration.ephemeral
            cfg.timeoutIntervalForRequest = 8; cfg.timeoutIntervalForResource = 15
            cfg.httpCookieAcceptPolicy = .always; cfg.httpShouldSetCookies = true
            cfg.httpAdditionalHeaders = ["Accept": "application/json"]
            guard let jar = cfg.httpCookieStorage else { return nil }
            for c in snap.cookies { if let h = sbHTTPCookie(c, originURL: base) { jar.setCookie(h) } }
            self.id = id; self.origin = origin; self.jar = jar
            self.session = URLSession(configuration: cfg, delegate: SameSite(host: host), delegateQueue: nil)
        }
        // nil: signed out (401/403, a redirect off the site, or a page instead of data); .some(nil): no answer
        func json(_ path: String) async -> Any?? {
            guard let url = URL(string: origin + path) else { return .some(nil) }
            do {
                let (data, resp) = try await session.data(from: url)
                guard let http = resp as? HTTPURLResponse else { return .some(nil) }
                if [401, 403].contains(http.statusCode) || (300..<400).contains(http.statusCode) || sbOrigin(http.url) != origin { return nil }
                let type = (http.value(forHTTPHeaderField: "Content-Type") ?? "").lowercased()
                if http.statusCode == 200 && !type.contains("json") { return type.contains("html") ? nil : .some(nil) }
                guard http.statusCode == 200 else { return .some(nil) }
                return .some(try? JSONSerialization.jsonObject(with: data))
            } catch { return .some(nil) }
        }
        func page(_ path: String) async -> (ok: Bool, signedIn: Bool) {
            guard let url = URL(string: origin + path) else { return (false, false) }
            var r = URLRequest(url: url); r.setValue("text/html", forHTTPHeaderField: "Accept")
            guard let res = try? await session.data(for: r), let http = res.1 as? HTTPURLResponse else { return (false, false) }
            let data = res.0
            if (300..<400).contains(http.statusCode) || [401, 403].contains(http.statusCode) || sbOrigin(http.url) != origin { return (true, false) }
            let text = String(decoding: data.prefix(400_000), as: UTF8.self)
            return (http.statusCode == 200, http.statusCode == 200 && !(http.url?.path.contains("/login/") ?? false) && text.range(of: "data-userid|usermenu|user-menu-toggle|userbutton", options: .regularExpression) != nil)
        }
        // what the school set on the way: back into the copy and into the app's web view store
        func keepCookies() {
            let host = URL(string: origin)?.host?.lowercased() ?? ""
            let list = (jar.cookies ?? []).map { c in SBSchoolHandoff.Cookie(name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.isSecure, httpOnly: c.isHTTPOnly,
                                                                            hostOnly: !c.domain.hasPrefix("."), sameSite: c.sameSitePolicy?.rawValue, expirationDate: c.expiresDate?.timeIntervalSince1970) }
                .filter { SBSchoolHandoff.cookieFits($0, host: host) }
            if !list.isEmpty { SBSchoolHandoff.saveSnapshot(id, origin: origin, list) }
            session.finishTasksAndInvalidate()
        }
    }

    private static let iso: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime]; return f }()
    private static let isoMs: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f }()
    private static func date(_ s: Any?) -> Date? { guard let s = s as? String else { return nil }; return iso.date(from: s) ?? isoMs.date(from: s) }
    private static func q(_ d: Date, ms: Bool = false) -> String { (ms ? isoMs : iso).string(from: d).addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "+:"))) ?? "" }

    @available(iOS 15.0, *)
    static func check(_ id: String, _ s: Site) async -> Outcome {
        let from = Date().addingTimeInterval(-14 * 86400), to = Date().addingTimeInterval(60 * 86400)
        switch id {
        case "canvas":
            // the student's planner: assignments, quizzes, discussions with their dates, and whether each has been graded
            guard let r = await s.json("/api/v1/planner/items?per_page=100&start_date=\(q(from))&end_date=\(q(to))") else { return .needLogin }
            guard let list = r as? [[String: Any]] else { return .unknown }
            return .items(list.compactMap { it in
                guard let pid = it["plannable_id"], let p = it["plannable"] as? [String: Any], let title = p["title"] as? String else { return nil }
                let sub = it["submissions"] as? [String: Any]
                return Item(key: "\(it["plannable_type"] ?? "")-\(pid)", title: title, course: (it["context_name"] as? String) ?? "",
                            due: date(it["plannable_date"]), graded: (sub?["graded"] as? Bool) ?? false)
            })
        case "brightspace":
            guard let v = await s.json("/d2l/api/versions/") else { return .needLogin }
            let vs = (v as? [[String: Any]]) ?? []
            func ver(_ code: String, _ def: String) -> String {
                let x = (vs.first { ($0["ProductCode"] as? String)?.lowercased() == code }?["LatestVersion"] as? String) ?? def
                return x.range(of: "^\\d{1,2}\\.\\d{1,3}$", options: .regularExpression) != nil ? x : def
            }
            guard let me = await s.json("/d2l/api/lp/\(ver("lp", "1.30"))/users/whoami") else { return .needLogin }
            guard me != nil else { return .unknown }
            // the calendar across all the student's courses: due dates and other dated items (Brightspace has no one call for new grades)
            guard let r = await s.json("/d2l/api/le/\(ver("le", "1.60"))/calendar/events/myEvents/?startDateTime=\(q(from, ms: true))&endDateTime=\(q(to, ms: true))") else { return .needLogin }
            let list = ((r as? [String: Any])?["Objects"] as? [[String: Any]]) ?? (r as? [[String: Any]]) ?? []
            return .items(list.compactMap { e in
                guard let eid = e["CalendarEventId"], let title = e["Title"] as? String else { return nil }
                return Item(key: "e-\(eid)", title: title, course: (e["OrgUnitName"] as? String) ?? "", due: date(e["EndDateTime"]) ?? date(e["StartDateTime"]), graded: false)
            })
        case "blackboard":
            for p in ["/learn/api/public/v1/users/me", "/learn/api/v1/users/me"] {
                let r = await s.json(p)
                if r == nil { return .needLogin }
                if (r! as? [String: Any])?["id"] != nil { return .items([]) }
            }
            return .unknown
        case "moodle":
            let r = await s.page("/user/profile.php")
            return !r.ok && !r.signedIn ? .unknown : r.signedIn ? .items([]) : .needLogin
        default:
            return .unknown
        }
    }

    // Every school site that syncs automatically, side by side, within the time iOS gives
    static func runAll() async {
        guard #available(iOS 15.0, *) else { return }
        let schools = SBSchools.all().filter { $0.value.auto }
        await withTaskGroup(of: Void.self) { g in
            for (id, e) in schools {
                g.addTask {
                    guard let site = Site(id: id, origin: e.origin) else { return }
                    let out = await check(id, site)
                    site.keepCookies()
                    await handle(id, e, out)
                }
            }
        }
    }

    @available(iOS 15.0, *) @MainActor
    private static func handle(_ id: String, _ e: SBSchools.Entry, _ out: Outcome) async {
        let name = sbNames[id] ?? "Your school site"
        switch out {
        case .unknown: return
        case .needLogin:
            SBSchools.markNeedLogin(id, true)
            if SBSchoolHandoff.isWanted(id, origin: e.origin) { SBSchoolHandoff.setWanted(id, origin: e.origin, need: true) }
            // one notice a day at most, and none while the earlier one is still waiting
            guard e.alerts, Date().timeIntervalSince1970 - e.loginNoticeAt > 20 * 3600 else { return }
            let google = SBSchoolHandoff.isWanted(id, origin: e.origin)
            await notify(id: "sb-school-login-" + id, title: "\(name) signed you out",
                         body: google ? "Tap to sign in again in Safari. If Safari remembers you, it only takes a moment." : "Tap to sign in again, so Studyboard keeps your due dates and grades up to date.",
                         school: id, kind: "login")
            SBSchools.noticed(id)
        case .items(let items):
            if e.needLogin { SBSchools.markNeedLogin(id, false) }
            let key = seenKey + id, now = Date()
            let had = (UserDefaults.standard.data(forKey: key)).flatMap { try? JSONDecoder().decode(Seen.self, from: $0) }
            let newWork = items.filter { it in !(had?.items.contains(it.key) ?? true) && (it.due.map { $0 > now } ?? false) }
            let newGrades = items.filter { it in it.graded && !(had?.graded.contains(it.key) ?? true) }
            let seen = Seen(items: Array(Set((had?.items ?? []) + items.map { $0.key })).suffix(3000).map { $0 },
                            graded: Array(Set((had?.graded ?? []) + items.filter { $0.graded }.map { $0.key })).suffix(3000).map { $0 })
            if let d = try? JSONEncoder().encode(seen) { UserDefaults.standard.set(d, forKey: key) }
            // (the first check only learns what's there)
            guard had != nil, e.alerts, !(newWork.isEmpty && newGrades.isEmpty) else { return }
            let df = DateFormatter(); df.setLocalizedDateFormatFromTemplate("EEE MMM d")
            if newWork.count + newGrades.count > 3 {
                let parts = [newWork.isEmpty ? nil : "\(newWork.count) new to do", newGrades.isEmpty ? nil : "\(newGrades.count) new \(newGrades.count == 1 ? "grade" : "grades")"].compactMap { $0 }
                await notify(id: "sb-school-new-\(id)-\(Int(now.timeIntervalSince1970))", title: "\(name): \(parts.joined(separator: ", "))", body: "Open Studyboard to see them.", school: id, kind: "new")
                return
            }
            for it in newWork {
                await notify(id: "sb-school-new-\(id)-\(it.key)", title: "New in \(it.course.isEmpty ? name : it.course)",
                             body: it.title + (it.due.map { ", due \(df.string(from: $0))" } ?? ""), school: id, kind: "new")
            }
            // (only that there's a grade, not what it is: notifications can show on the Lock Screen)
            for it in newGrades {
                await notify(id: "sb-school-grade-\(id)-\(it.key)", title: "New grade in \(it.course.isEmpty ? name : it.course)", body: it.title, school: id, kind: "new")
            }
        }
    }

    @available(iOS 15.0, *)
    private static func notify(id: String, title: String, body: String, school: String, kind: String) async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        guard [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus) else { return }
        let c = UNMutableNotificationContent()
        c.title = String(title.prefix(120)); c.body = String(body.prefix(240))
        c.threadIdentifier = "sb-school-" + school
        c.userInfo = ["sbSchool": school, "kind": kind]
        try? await center.add(UNNotificationRequest(identifier: id, content: c, trigger: nil))
    }
}

// A cookie as the school gave it (SBSchoolHandoff.Cookie) for HTTPCookieStorage or the web view store
func sbHTTPCookie(_ c: SBSchoolHandoff.Cookie, originURL: URL) -> HTTPCookie? {
    var p: [HTTPCookiePropertyKey: Any] = [.name: c.name, .value: c.value, .path: c.path]
    if c.hostOnly { p[.originURL] = originURL } else { p[.domain] = c.domain.hasPrefix(".") ? c.domain : "." + c.domain }
    if c.secure { p[.secure] = "TRUE" }
    p[.expires] = c.expirationDate.map { Date(timeIntervalSince1970: $0) } ?? Date().addingTimeInterval(7 * 86400)
    if c.httpOnly { p[HTTPCookiePropertyKey("HttpOnly")] = "TRUE" }
    switch (c.sameSite ?? "").lowercased() {
    case "lax": p[.sameSitePolicy] = HTTPCookieStringPolicy.sameSiteLax.rawValue
    case "strict": p[.sameSitePolicy] = HTTPCookieStringPolicy.sameSiteStrict.rawValue
    default: break
    }
    return HTTPCookie(properties: p)
}

// 3. Tapping one of these notifications. Capacitor's own handler stays in charge of everything else (reminders): this sits in
// front of it and passes on anything that isn't a school notification. Put in front once the app is open (Capacitor sets its
// handler while starting); a tap that starts the app from closed just opens it, where the Sign In Again button is waiting.
final class SBNotificationTaps: NSObject, UNUserNotificationCenterDelegate {
    static let shared = SBNotificationTaps()
    weak var next: UNUserNotificationCenterDelegate?
    static func install() {
        let c = UNUserNotificationCenter.current()
        if c.delegate === shared { return }
        shared.next = c.delegate
        c.delegate = shared
    }
    private func mine(_ n: UNNotification) -> String? { n.request.content.userInfo["sbSchool"] as? String }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if mine(notification) != nil { return completionHandler([]) }   // the app is open: it shows the same thing itself
        if next?.userNotificationCenter?(center, willPresent: notification, withCompletionHandler: completionHandler) == nil { completionHandler([]) }
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        guard let id = mine(response.notification) else {
            if next?.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler) == nil { completionHandler() }
            return
        }
        let kind = response.notification.request.content.userInfo["kind"] as? String ?? ""
        DispatchQueue.main.async {
            if kind == "login", let e = SBSchools.all()[id], SBSchoolHandoff.isWanted(id, origin: e.origin), let url = URL(string: e.origin + "/") {
                // a Google school: Safari straight away (the extension hands the sign-in back; the app syncs when it's next open)
                SBSchoolHandoff.setWanted(id, origin: e.origin, need: true)
                sbOpenInSafari(url)
            } else if kind == "login" {
                StudyboardSchoolBackground.page("window.__sbSchoolRelog ? window.__sbSchoolRelog(\(sbJSString(id))) : 'loading'")
            } else {
                StudyboardSchoolBackground.page("window.__sbSchoolSync ? (window.__sbSchoolSync(), true) : 'loading'")
            }
            completionHandler()
        }
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter, openSettingsFor notification: UNNotification?) {
        next?.userNotificationCenter?(center, openSettingsFor: notification)
    }
}
// A JavaScript string literal for s
private func sbJSString(_ s: String) -> String {
    guard let d = try? JSONSerialization.data(withJSONObject: [s]), let a = String(data: d, encoding: .utf8) else { return "\"\"" }
    return String(a.dropFirst().dropLast())
}

// Registering and scheduling (1 and 2)
@objc(StudyboardSchoolBackground)
final class StudyboardSchoolBackground: NSObject {
    static let checkID = "com.studyboardapp.studyboard.schoolcheck"
    static let syncID = "com.studyboardapp.studyboard.schoolsync"
    private static var registered = false

    // From AppDelegate's didFinishLaunchingWithOptions, through StudyboardBackgroundRefresh.register()
    @objc static func register() {
        guard !registered else { return }
        registered = true
        BGTaskScheduler.shared.register(forTaskWithIdentifier: checkID, using: nil) { task in
            guard let t = task as? BGAppRefreshTask else { task.setTaskCompleted(success: false); return }
            quickCheck(t)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: syncID, using: nil) { task in
            guard let t = task as? BGProcessingTask else { task.setTaskCompleted(success: false); return }
            fullSync(t)
        }
        NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { _ in schedule() }
        NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in SBNotificationTaps.install() }
    }

    static func schedule() {
        guard registered, SBSchools.all().values.contains(where: { $0.auto }) else { return }
        let check = BGAppRefreshTaskRequest(identifier: checkID)
        check.earliestBeginDate = Date(timeIntervalSinceNow: 20 * 60)
        try? BGTaskScheduler.shared.submit(check)
        let sync = BGProcessingTaskRequest(identifier: syncID)
        sync.requiresNetworkConnectivity = true
        sync.requiresExternalPower = false
        sync.earliestBeginDate = Date(timeIntervalSinceNow: 3 * 3600)
        try? BGTaskScheduler.shared.submit(sync)
    }

    private static func quickCheck(_ task: BGAppRefreshTask) {
        let next = BGAppRefreshTaskRequest(identifier: checkID)
        next.earliestBeginDate = Date(timeIntervalSinceNow: 20 * 60)
        try? BGTaskScheduler.shared.submit(next)
        let work = Task { await SBSchoolCheck.runAll() }
        task.expirationHandler = { work.cancel() }
        Task { await work.value; task.setTaskCompleted(success: !work.isCancelled) }
    }

    private static func fullSync(_ task: BGProcessingTask) {
        var done = false
        let finish: (Bool) -> Void = { ok in DispatchQueue.main.async { if !done { done = true; task.setTaskCompleted(success: ok) } } }
        task.expirationHandler = { finish(false) }
        DispatchQueue.main.async {
            page("if (typeof window.__sbSchoolSync !== 'function') return 'loading'; return await window.__sbSchoolSync();", tries: 0) { ok in
                schedule()
                finish(ok)
            }
        }
    }

    // Runs JavaScript in the app's page once it's loaded (iOS may have started the app just for this): asked again each second, up to 15 times
    static func page(_ js: String, tries: Int = 0, _ done: ((Bool) -> Void)? = nil) {
        let body = js.contains("return") ? js : "return " + js + ";"
        guard let web = bridgeWebView() else {
            if tries < 15 { DispatchQueue.main.asyncAfter(deadline: .now() + 1) { page(js, tries: tries + 1, done) } } else { done?(false) }
            return
        }
        web.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { r in
            if case .success(let v) = r, (v as? String) == "loading" {
                if tries < 15 { DispatchQueue.main.asyncAfter(deadline: .now() + 1) { page(js, tries: tries + 1, done) } } else { done?(false) }
                return
            }
            if case .success = r { done?(true) } else { done?(false) }
        }
    }
    private static func bridgeWebView() -> WKWebView? {
        func find(_ vc: UIViewController?) -> CAPBridgeViewController? {
            guard let vc = vc else { return nil }
            if let b = vc as? CAPBridgeViewController { return b }
            for c in vc.children { if let b = find(c) { return b } }
            return find(vc.presentedViewController)
        }
        let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }
        let roots = ((UIApplication.shared.delegate?.window ?? nil).map { [$0] } ?? []) + windows
        for w in roots { if let b = find(w.rootViewController) { _ = b.view; return b.bridge?.webView } }
        return nil
    }
}
