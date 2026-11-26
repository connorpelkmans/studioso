// UNTESTED: written without compiler access or a device
import Foundation
import UIKit
import WebKit
import CryptoKit
import Capacitor

private let sbSafariUA = "Version/17.0 Mobile/15E148 Safari/604.1"

// One private sign-in store per platform (iOS 17+)
private let sbStoreIds: [String: UUID] = [
    "brightspace": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B01")!,
    "canvas": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B02")!,
    "blackboard": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B03")!,
    "moodle": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B04")!
]

func sbOrigin(_ url: URL?) -> String {
    guard let u = url, u.scheme == "https", let h = u.host else { return "" }
    let port = (u.port != nil && u.port != 443) ? ":\(u.port!)" : ""
    return "https://\(h.lowercased())\(port)"
}

func sbStore(_ id: String) -> WKWebsiteDataStore {
    if #available(iOS 17.0, *), let uid = sbStoreIds[id] { return WKWebsiteDataStore(forIdentifier: uid) }
    return WKWebsiteDataStore.default()
}

private func sbConfig(_ id: String) -> WKWebViewConfiguration {
    let c = WKWebViewConfiguration()
    c.websiteDataStore = sbStore(id)
    c.applicationNameForUserAgent = sbSafariUA
    c.preferences.javaScriptCanOpenWindowsAutomatically = false
    c.allowsInlineMediaPlayback = false
    return c
}

// Google's sign-in page. Google doesn't allow it inside an app's own web view, so these web views never load it:
// the student signs in to a Google school in Safari instead (SchoolSafari/SBSchoolHandoff.swift).
private func sbIsGoogleSignIn(_ url: URL?) -> Bool {
    guard let h = url?.host?.lowercased() else { return false }
    return h == "accounts.google.com" || h.hasSuffix(".accounts.google.com")
}

let sbNames = ["brightspace": "Brightspace", "canvas": "Canvas", "blackboard": "Blackboard", "moodle": "Moodle"]

// Put a sign-in Safari handed over into this platform's web view store
func sbImport(_ id: String, origin: String, _ cookies: [SBSchoolHandoff.Cookie], _ done: @escaping () -> Void) {
    guard let originURL = URL(string: origin + "/") else { return done() }
    let store = sbStore(id).httpCookieStore, group = DispatchGroup()
    // Safari keeps a site's session cookies across restarts; here they'd be lost whenever iOS closes the app, so they're
    // kept for a week (the school still decides how long the sign-in itself lasts)
    let week = Date().addingTimeInterval(7 * 24 * 3600)
    for c in cookies {
        var p: [HTTPCookiePropertyKey: Any] = [.name: c.name, .value: c.value, .path: c.path]
        if c.hostOnly { p[.originURL] = originURL } else { p[.domain] = c.domain.hasPrefix(".") ? c.domain : "." + c.domain }
        if c.secure { p[.secure] = "TRUE" }
        p[.expires] = c.expirationDate.map { Date(timeIntervalSince1970: $0) } ?? week
        if c.httpOnly { p[HTTPCookiePropertyKey("HttpOnly")] = "TRUE" }
        switch (c.sameSite ?? "").lowercased() {
        case "lax": p[.sameSitePolicy] = HTTPCookieStringPolicy.sameSiteLax.rawValue
        case "strict": p[.sameSitePolicy] = HTTPCookieStringPolicy.sameSiteStrict.rawValue
        default: break
        }
        guard let cookie = HTTPCookie(properties: p) else { continue }
        group.enter()
        store.setCookie(cookie) { group.leave() }
    }
    group.notify(queue: .main, execute: done)
}

// A sign-in Safari handed over for this site, if one is waiting: put in place, then go on
let sbHandoffImported = Notification.Name("SBSchoolHandoffImported")
func sbPullHandoff(_ id: String, origin: String, _ then: @escaping (Bool) -> Void) {
    guard let cookies = SBSchoolHandoff.take(id, origin: origin) else { return then(false) }
    sbImport(id, origin: origin, cookies) {
        // (the sign-in screen, if it's waiting for Safari, checks it straight away)
        NotificationCenter.default.post(name: sbHandoffImported, object: nil, userInfo: ["id": id])
        then(true)
    }
}

// The background check's copy of the sign-in (SBSchoolHandoff.saveSnapshot): taken after each good sync here, and put back
// before the next one if the background check got newer cookies from the school since
private let sbSnapUsedKey = "sbSchoolSnapUsed."
func sbSnapshotNow(_ id: String, origin: String) {
    let host = URL(string: origin)?.host?.lowercased() ?? ""
    DispatchQueue.main.async {
        sbStore(id).httpCookieStore.getAllCookies { all in
            let list = all.map { c in SBSchoolHandoff.Cookie(name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.isSecure,
                                                           httpOnly: c.isHTTPOnly, hostOnly: !c.domain.hasPrefix("."), sameSite: c.sameSitePolicy?.rawValue,
                                                           expirationDate: c.expiresDate?.timeIntervalSince1970) }
                .filter { SBSchoolHandoff.cookieFits($0, host: host) }
            SBSchoolHandoff.saveSnapshot(id, origin: origin, list)
            if let s = SBSchoolHandoff.snapshot(id, origin: origin) { UserDefaults.standard.set(s.at, forKey: sbSnapUsedKey + id) }
        }
    }
}
func sbApplyNewerSnapshot(_ id: String, origin: String, _ then: @escaping () -> Void) {
    guard let s = SBSchoolHandoff.snapshot(id, origin: origin), s.at > UserDefaults.standard.double(forKey: sbSnapUsedKey + id) else { return then() }
    UserDefaults.standard.set(s.at, forKey: sbSnapUsedKey + id)
    sbImport(id, origin: origin, s.cookies, then)
}

// Opens the school site in Safari, even when another browser is the default (x-safari-https opens Safari itself;
// if iOS ever stops accepting it, the default browser opens and the steps on screen still say Safari)
func sbOpenInSafari(_ url: URL) {
    var c = URLComponents(url: url, resolvingAgainstBaseURL: false)
    c?.scheme = "x-safari-https"
    guard let safari = c?.url else { UIApplication.shared.open(url); return }
    UIApplication.shared.open(safari, options: [:]) { ok in if !ok { UIApplication.shared.open(url) } }
}

// Navigation and permission rules shared by the sign-in view and the hidden view
private class SBGuard: NSObject, WKNavigationDelegate, WKUIDelegate {
    var onFinish: (() -> Void)?
    var onFail: (() -> Void)?
    var onGoogle: (() -> Void)?
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let u = navigationAction.request.url, s = u?.scheme?.lowercased() ?? ""
        if sbIsGoogleSignIn(u) { decisionHandler(.cancel); onGoogle?(); return }
        decisionHandler(s == "https" || s == "about" ? .allow : .cancel)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { onFinish?() }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { onFail?() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { onFail?() }
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) { decisionHandler(.deny) }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let u = navigationAction.request.url, u.scheme == "https" { webView.load(navigationAction.request) }
        return nil
    }
}

// One allowed script (the list is sbLmsScripts in StudyboardLmsScripts.swift)
struct SBLmsScript { let id: String; let use: String; let lens: [Int]; let hashes: [String]; let holes: [String] }

private func sbSha256(_ b: ArraySlice<UInt8>) -> String { SHA256.hash(data: Data(b)).map { String(format: "%02x", $0) }.joined() }

private func sbFill(_ t: SBLmsScript, _ b: [UInt8], _ origin: String) -> String? {
    var out = "", pos = 0
    let last = t.lens.count - 1
    for i in 0...last {
        let len = t.lens[i]
        guard pos + len <= b.count, sbSha256(b[pos..<pos + len]) == t.hashes[i], let seg = String(bytes: b[pos..<pos + len], encoding: .utf8) else { return nil }
        out += seg; pos += len
        if i == last { return pos == b.count ? out : nil }
        switch t.holes[i] {
        case "digits":
            var j = pos
            while j < b.count, j - pos < 14, b[j] >= 48, b[j] <= 57 { j += 1 }
            guard j > pos, let s = String(bytes: b[pos..<j], encoding: .utf8) else { return nil }
            out += s; pos = j
        case "json", "url":
            let end = b.count - t.lens[last]
            guard i + 1 == last, end >= pos,
                  let v = try? JSONSerialization.jsonObject(with: Data(b[pos..<end]), options: [.fragmentsAllowed]) else { return nil }
            if t.holes[i] == "url" { guard let s = v as? String, s.utf16.count <= 4000, s.hasPrefix(origin + "/") else { return nil } }
            guard let d = try? JSONSerialization.data(withJSONObject: v, options: [.fragmentsAllowed]), let text = String(data: d, encoding: .utf8) else { return nil }
            out += text; pos = end
        default:
            return nil
        }
    }
    return nil
}

// The script to run (with its holes checked and refilled here)
private func sbAllowedScript(id: String, use: String, script: String, origin: String) -> String? {
    let b = Array(script.utf8)
    for t in sbLmsScripts where t.id == id && t.use == use {
        if let s = sbFill(t, b, origin) { return s }
    }
    return nil
}

private func sbEval(_ wv: WKWebView, _ expr: String, _ done: @escaping (Any?) -> Void) {
    // `expr` is an expression that may return a promise (an async arrow function called at once)
    let body = "const v = await (\(expr)); return JSON.stringify(v === undefined ? null : v);"
    wv.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { r in
        if case .success(let v) = r { done(v) } else { done(nil) }
    }
}

// The Safari step on the sign-in screen (schools that sign in with Google). The steps shrink as they're done: once
// the extension has been switched on, and once Safari lets it read this school site.
private class SBSafariPanel: UIView {
    let name: String, origin: String
    var onOpen: (() -> Void)?
    private let stack = UIStackView(), steps = UILabel(), statusLabel = UILabel()

    init(name: String, origin: String) {
        self.name = name; self.origin = origin
        super.init(frame: .zero)
        backgroundColor = .systemBackground
        let scroll = UIScrollView(); scroll.translatesAutoresizingMaskIntoConstraints = false
        addSubview(scroll)
        stack.axis = .vertical; stack.spacing = 16; stack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(stack)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: topAnchor), scroll.bottomAnchor.constraint(equalTo: bottomAnchor),
            scroll.leadingAnchor.constraint(equalTo: leadingAnchor), scroll.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 28),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -28),
            stack.leadingAnchor.constraint(equalTo: scroll.frameLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: scroll.frameLayoutGuide.trailingAnchor, constant: -24)
        ])
        let title = label("Finish Signing In with Safari", .title2)
        if let d = title.font.fontDescriptor.withSymbolicTraits(.traitBold) { title.font = UIFont(descriptor: d, size: 0) }
        title.accessibilityTraits = .header
        let intro = label("Your school signs in to \(name) with Google, and Google only allows that in a browser like Safari. "
            + "You do this once. After that, Studyboard keeps syncing \(name) by itself.", .body)
        // (a plain filled button: the app still supports iOS 14, which has no UIButton.Configuration)
        let open = UIButton(type: .system, primaryAction: UIAction { [weak self] _ in self?.onOpen?() })
        open.setTitle("Open \(name) in Safari", for: .normal)
        open.titleLabel?.font = .preferredFont(forTextStyle: .headline); open.titleLabel?.adjustsFontForContentSizeCategory = true
        open.backgroundColor = .systemBlue; open.setTitleColor(.white, for: .normal)
        open.layer.cornerRadius = 12; open.contentEdgeInsets = UIEdgeInsets(top: 14, left: 18, bottom: 14, right: 18)
        statusLabel.font = .preferredFont(forTextStyle: .callout); statusLabel.textColor = .secondaryLabel
        statusLabel.numberOfLines = 0; statusLabel.adjustsFontForContentSizeCategory = true; statusLabel.isHidden = true
        let host = URL(string: origin)?.host ?? origin
        let note = label("Studyboard never sees your Google password. Safari passes on only \(host)'s own sign-in, and it stays on this iPhone.", .footnote)
        note.textColor = .secondaryLabel
        steps.numberOfLines = 0; steps.adjustsFontForContentSizeCategory = true
        [title, intro, steps, open, statusLabel, note].forEach { stack.addArrangedSubview($0) }
        stack.setCustomSpacing(24, after: steps)
        refresh(again: false)
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    private func label(_ text: String, _ style: UIFont.TextStyle) -> UILabel {
        let l = UILabel(); l.text = text; l.font = .preferredFont(forTextStyle: style)
        l.numberOfLines = 0; l.adjustsFontForContentSizeCategory = true
        return l
    }

    func refresh(again: Bool) {
        var list: [String] = []
        if !SBSchoolHandoff.extensionSeen() {
            list.append("Turn on Studyboard in Safari: open the Settings app, then Apps › Safari › Extensions › Studyboard, and switch on Allow Extension.")
        }
        list.append("Tap Open \(name) in Safari below and sign in as usual. If you're already signed in there, Safari skips this.")
        if !SBSchoolHandoff.extensionAllowed(on: origin) {
            list.append("Still in Safari, tap the ᴀA or ⋯ button by the address, then Studyboard. Tap Agree, Allow and Connect, and choose Always Allow on This Website.")
        }
        list.append("Safari hands the sign-in to Studyboard. Come back here and you're done.")
        let body = UIFont.preferredFont(forTextStyle: .body)
        let para = NSMutableParagraphStyle()
        para.headIndent = 24; para.paragraphSpacing = 10
        para.tabStops = [NSTextTab(textAlignment: .left, location: 24, options: [:])]
        steps.attributedText = NSAttributedString(string: list.enumerated().map { "\($0.offset + 1).\t\($0.element)" }.joined(separator: "\n"),
                                                  attributes: [.font: body, .paragraphStyle: para, .foregroundColor: UIColor.label])
        if again { status("\(name) asked for your Google sign-in again. Sign in in Safari once more.") }
    }
    func status(_ text: String) {
        statusLabel.text = text
        statusLabel.isHidden = text.isEmpty
        if !text.isEmpty { UIAccessibility.post(notification: .announcement, argument: text) }
    }
}

// The visible sign-in screen
private class SBSignInController: UIViewController {
    let id: String, origin: String, startURL: URL, who: String
    let guardDelegate = SBGuard()
    var webView: WKWebView!
    var hostLabel = UILabel()
    var timer: Timer?
    var finished = false
    var completion: (([String: Any]) -> Void)?
    // Safari step (schools that sign in with Google)
    var safari: SBSafariPanel?
    var importing = false
    // whether Safari already kept this site's sign-in fresh before this screen opened (Cancel leaves that as it was)
    lazy var wantedBefore = SBSchoolHandoff.isWanted(id, origin: origin)

    init(id: String, origin: String, url: URL, who: String) {
        self.id = id; self.origin = origin; self.startURL = url; self.who = who
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let bar = UIView(); bar.translatesAutoresizingMaskIntoConstraints = false; bar.backgroundColor = .secondarySystemBackground
        let cancel = UIButton(type: .system); cancel.setTitle("Cancel", for: .normal); cancel.translatesAutoresizingMaskIntoConstraints = false
        cancel.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        hostLabel.translatesAutoresizingMaskIntoConstraints = false; hostLabel.font = .preferredFont(forTextStyle: .footnote); hostLabel.textColor = .secondaryLabel
        hostLabel.lineBreakMode = .byTruncatingMiddle
        bar.addSubview(cancel); bar.addSubview(hostLabel)
        webView = WKWebView(frame: .zero, configuration: sbConfig(id))
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = guardDelegate; webView.uiDelegate = guardDelegate
        guardDelegate.onFinish = { [weak self] in self?.check() }
        guardDelegate.onGoogle = { [weak self] in self?.showSafari() }
        view.addSubview(bar); view.addSubview(webView)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: g.topAnchor), bar.leadingAnchor.constraint(equalTo: view.leadingAnchor), bar.trailingAnchor.constraint(equalTo: view.trailingAnchor), bar.heightAnchor.constraint(equalToConstant: 44),
            cancel.leadingAnchor.constraint(equalTo: bar.leadingAnchor, constant: 12), cancel.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
            hostLabel.leadingAnchor.constraint(equalTo: cancel.trailingAnchor, constant: 12), hostLabel.trailingAnchor.constraint(equalTo: bar.trailingAnchor, constant: -12), hostLabel.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
            webView.topAnchor.constraint(equalTo: bar.bottomAnchor), webView.leadingAnchor.constraint(equalTo: view.leadingAnchor), webView.trailingAnchor.constraint(equalTo: view.trailingAnchor), webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        webView.addObserver(self, forKeyPath: "URL", options: [.new], context: nil)
        // (a sign-in Safari handed over while the app was closed is used straight away)
        sbPullHandoff(id, origin: origin) { [weak self] _ in guard let self = self else { return }; self.webView.load(URLRequest(url: self.startURL)) }
        timer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [weak self] _ in self?.check(); self?.pullSafari() }
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(importedElsewhere(_:)), name: sbHandoffImported, object: nil)
    }
    // a sync picked up Safari's sign-in before this screen did: check it here too
    @objc func importedElsewhere(_ n: Notification) {
        guard safari != nil, !finished, !importing, (n.userInfo?["id"] as? String) == id else { return }
        importing = true
        safari?.status("Signing you in…")
        webView.load(URLRequest(url: startURL))
    }
    deinit { NotificationCenter.default.removeObserver(self) }

    // The school sent the sign-in to Google: carry on in Safari
    func showSafari() {
        if finished { return }
        _ = wantedBefore
        SBSchools.markNeedLogin(id, true)
        SBSchoolHandoff.setWanted(id, origin: origin, need: true)
        let was = importing
        importing = false
        webView.stopLoading()
        if let p = safari { p.refresh(again: was); return }
        let p = SBSafariPanel(name: sbNames[id] ?? "your school site", origin: origin)
        p.onOpen = { [weak self] in guard let self = self else { return }; sbOpenInSafari(self.startURL) }
        p.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(p)
        NSLayoutConstraint.activate([
            p.topAnchor.constraint(equalTo: webView.topAnchor), p.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            p.trailingAnchor.constraint(equalTo: view.trailingAnchor), p.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        safari = p
        hostLabel.text = "Sign in with Safari"
        // signing in again to a school that already went through Safari, with the extension set up: straight to Safari
        if wantedBefore, SBSchoolHandoff.extensionSeen(), SBSchoolHandoff.extensionAllowed(on: origin) {
            p.status("Opening Safari…")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                guard let self = self, !self.finished, UIApplication.shared.applicationState == .active else { return }
                sbOpenInSafari(self.startURL)
            }
        }
    }
    @objc func becameActive() { pullSafari(); safari?.refresh(again: false) }
    // Safari handed the sign-in over: put it in place and check it here (check() finishes once the site knows the student)
    func pullSafari() {
        guard safari != nil, !finished, !importing, SBSchoolHandoff.waiting(id) else { return }
        importing = true
        safari?.status("Signing you in…")
        sbPullHandoff(id, origin: origin) { [weak self] ok in
            guard let self = self, !self.finished else { return }
            if !ok { self.importing = false; self.safari?.status(""); return }
            self.webView.load(URLRequest(url: self.startURL))
            // the school didn't take it (onGoogle shows the steps again first if it sent the sign-in back to Google)
            DispatchQueue.main.asyncAfter(deadline: .now() + 25) { [weak self] in
                guard let self = self, !self.finished, self.importing else { return }
                self.importing = false
                self.safari?.status("That sign-in didn't carry over. Open Safari and try once more.")
            }
        }
    }
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "URL", safari == nil { hostLabel.text = webView.url?.host ?? "" }
    }
    func check() {
        guard !finished, sbOrigin(webView.url) == origin else { return }
        sbEval(webView, who) { [weak self] v in
            guard let self = self, !self.finished, let s = v as? String, s != "null",
                  let d = try? JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any] else { return }
            self.finish(["ok": true, "name": (d["name"] as? String) ?? ""])
        }
    }
    @objc func cancelTapped() { finish(["ok": false, "cancelled": true]) }
    func finish(_ r: [String: Any]) {
        if finished { return }; finished = true
        // signed in through Safari: Safari keeps the app's sign-in fresh from now on, whenever the site is open there
        if safari != nil, r["ok"] as? Bool == true { SBSchoolHandoff.setWanted(id, origin: origin, need: false) }
        else if safari != nil, r["cancelled"] as? Bool == true, !wantedBefore { SBSchoolHandoff.clear(id) }
        timer?.invalidate(); webView.removeObserver(self, forKeyPath: "URL")
        NotificationCenter.default.removeObserver(self)
        dismiss(animated: true) { [completion] in completion?(r) }
    }
}

// One hidden page load plus script run
private class SBRun {
    let wv: WKWebView, guardDelegate = SBGuard()
    var done = false
    init(id: String, host: UIView) {
        wv = WKWebView(frame: CGRect(x: 0, y: 0, width: 360, height: 640), configuration: sbConfig(id))
        wv.alpha = 0.01; wv.isUserInteractionEnabled = false
        wv.navigationDelegate = guardDelegate; wv.uiDelegate = guardDelegate
        host.insertSubview(wv, at: 0)
    }
    func finish(_ r: [String: Any], _ cb: @escaping ([String: Any]) -> Void) {
        if done { return }; done = true
        wv.stopLoading(); wv.removeFromSuperview(); cb(r)
    }
}

@objc(StudyboardLmsPlugin)
public class StudyboardLmsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardLmsPlugin"
    public let jsName = "StudyboardLms"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "run", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signOut", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prefs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "safariResult", returnType: CAPPluginReturnPromise)
    ]

    private func checked(_ call: CAPPluginCall) -> (id: String, origin: String, url: URL)? {
        guard let id = call.getString("id"), sbStoreIds[id] != nil,
              let o = call.getString("origin"), let ou = URL(string: o), sbOrigin(ou) == o,
              let us = call.getString("url"), let url = URL(string: us), sbOrigin(url) == o else { call.reject("bad-request"); return nil }
        return (id, o, url)
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let c = checked(call) else { return }
        guard let given = call.getString("who"), given.utf16.count < 4000,
              let who = sbAllowedScript(id: c.id, use: "who", script: given, origin: c.origin) else { return call.reject("bad-request") }
        DispatchQueue.main.async {
            guard let top = self.bridge?.viewController else { return call.reject("no-view") }
            let vc = SBSignInController(id: c.id, origin: c.origin, url: c.url, who: who)
            vc.completion = { r in
                if r["ok"] as? Bool == true { SBSchools.connected(c.id, origin: c.origin); sbSnapshotNow(c.id, origin: c.origin) }
                call.resolve(r)
            }
            top.present(vc, animated: true)
        }
    }

    @objc func run(_ call: CAPPluginCall) {
        guard let c = checked(call) else { return }
        guard let given = call.getString("script"), given.utf16.count < 400_000 else { return call.reject("bad-request") }
        guard let script = sbAllowedScript(id: c.id, use: "run", script: given, origin: c.origin) else { return call.reject("script-not-allowed") }
        let ms = max(5, min(180, (call.getDouble("timeoutMs") ?? 60000) / 1000))
        DispatchQueue.main.async {
            guard let host = self.bridge?.viewController?.view else { return call.reject("no-view") }
            let r = SBRun(id: c.id, host: host)
            let reply: ([String: Any]) -> Void = { out in
                // what the background check and the page's sign-in status go by
                if out["needLogin"] as? Bool == true { SBSchools.markNeedLogin(c.id, true) }
                else if out["ok"] as? Bool == true { SBSchools.connected(c.id, origin: c.origin); sbSnapshotNow(c.id, origin: c.origin) }
                call.resolve(out)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + ms) { r.finish(["error": "timeout"], reply) }
            let go = { [weak r] in
                guard let r = r, !r.done else { return }
                if sbOrigin(r.wv.url) != c.origin { return r.finish(["needLogin": true], reply) }
                sbEval(r.wv, script) { v in
                    if let s = v as? String { r.finish(["ok": true, "json": s], reply) } else { r.finish(["error": "script-failed"], reply) }
                }
            }
            r.guardDelegate.onFinish = go
            r.guardDelegate.onFail = go
            // the school wants Google again: Safari can hand a fresh sign-in over the next time the site is open there
            r.guardDelegate.onGoogle = { [weak r] in
                guard let r = r, !r.done else { return }
                SBSchoolHandoff.setWanted(c.id, origin: c.origin, need: true)
                r.finish(["needLogin": true], reply)
            }
            sbApplyNewerSnapshot(c.id, origin: c.origin) {
                sbPullHandoff(c.id, origin: c.origin) { [weak r] _ in
                    guard let r = r, !r.done else { return }
                    r.wv.load(URLRequest(url: c.url))
                }
            }
        }
    }

    // The sign-in as the background check and the last sync left it (the page's keepAlive asks): null when not known here
    @objc func status(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let o = call.getString("origin"), let e = SBSchools.all()[id], e.origin == o else { return call.resolve([:]) }
        call.resolve(e.needLogin ? ["needLogin": true] : ["ok": true])
    }
    // The student's choices for this site: background checks (Sync Automatically) and notifications about them
    @objc func prefs(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), sbStoreIds[id] != nil else { return call.reject("bad-request") }
        SBSchools.setPrefs(id, auto: call.getBool("auto") ?? true, alerts: call.getBool("alerts") ?? true)
        call.resolve()
    }
    // What the Safari extension last read from this site (schools that sign in with Google), for when the app's own sign-in has run out
    @objc func safariResult(_ call: CAPPluginCall) {
        guard let c = checked(call) else { return }
        guard let r = SBSchoolHandoff.result(c.id, origin: c.origin) else { return call.resolve([:]) }
        call.resolve(["at": r.at, "json": r.json])
    }

    @objc func signOut(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), sbStoreIds[id] != nil else { return call.reject("bad-request") }
        let host = URL(string: call.getString("origin") ?? "")?.host ?? ""
        SBSchoolHandoff.forget(id)
        SBSchools.remove(id)
        DispatchQueue.main.async {
            let store = sbStore(id), types = WKWebsiteDataStore.allWebsiteDataTypes()
            if #available(iOS 17.0, *) {
                store.removeData(ofTypes: types, modifiedSince: .distantPast) { call.resolve() }
            } else {
                store.fetchDataRecords(ofTypes: types) { records in
                    let mine = records.filter { !host.isEmpty && (host.hasSuffix($0.displayName) || $0.displayName.hasSuffix(host)) }
                    store.removeData(ofTypes: types, for: mine) { call.resolve() }
                }
            }
        }
    }
}
