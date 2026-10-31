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

private func sbOrigin(_ url: URL?) -> String {
    guard let u = url, u.scheme == "https", let h = u.host else { return "" }
    let port = (u.port != nil && u.port != 443) ? ":\(u.port!)" : ""
    return "https://\(h.lowercased())\(port)"
}

private func sbStore(_ id: String) -> WKWebsiteDataStore {
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

// Navigation and permission rules shared by the sign-in view and the hidden view
private class SBGuard: NSObject, WKNavigationDelegate, WKUIDelegate {
    var onFinish: (() -> Void)?
    var onFail: (() -> Void)?
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let s = navigationAction.request.url?.scheme?.lowercased() ?? ""
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

// The visible sign-in screen
private class SBSignInController: UIViewController {
    let id: String, origin: String, startURL: URL, who: String
    let guardDelegate = SBGuard()
    var webView: WKWebView!
    var hostLabel = UILabel()
    var timer: Timer?
    var finished = false
    var completion: (([String: Any]) -> Void)?

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
        view.addSubview(bar); view.addSubview(webView)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: g.topAnchor), bar.leadingAnchor.constraint(equalTo: view.leadingAnchor), bar.trailingAnchor.constraint(equalTo: view.trailingAnchor), bar.heightAnchor.constraint(equalToConstant: 44),
            cancel.leadingAnchor.constraint(equalTo: bar.leadingAnchor, constant: 12), cancel.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
            hostLabel.leadingAnchor.constraint(equalTo: cancel.trailingAnchor, constant: 12), hostLabel.trailingAnchor.constraint(equalTo: bar.trailingAnchor, constant: -12), hostLabel.centerYAnchor.constraint(equalTo: bar.centerYAnchor),
            webView.topAnchor.constraint(equalTo: bar.bottomAnchor), webView.leadingAnchor.constraint(equalTo: view.leadingAnchor), webView.trailingAnchor.constraint(equalTo: view.trailingAnchor), webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        webView.addObserver(self, forKeyPath: "URL", options: [.new], context: nil)
        webView.load(URLRequest(url: startURL))
        timer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [weak self] _ in self?.check() }
    }
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "URL" { hostLabel.text = webView.url?.host ?? "" }
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
        timer?.invalidate(); webView.removeObserver(self, forKeyPath: "URL")
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
        CAPPluginMethod(name: "signOut", returnType: CAPPluginReturnPromise)
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
            vc.completion = { call.resolve($0) }
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
            let reply: ([String: Any]) -> Void = { call.resolve($0) }
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
            r.wv.load(URLRequest(url: c.url))
        }
    }

    @objc func signOut(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), sbStoreIds[id] != nil else { return call.reject("bad-request") }
        let host = URL(string: call.getString("origin") ?? "")?.host ?? ""
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
