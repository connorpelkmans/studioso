// UNTESTED: written without compiler access or a device. App Target only. Capacitor plugin `StudyboardLms` (Capacitor 6/7 `CAPBridgedPlugin` style; see
// StudyboardPlugins.swift for the same caveats). It is the native half of the phone apps' school site sync; the web half is lms-mobile.js
// (built from lms-mobile.src.js and lms.js by scripts/build-lms-mobile.js), which decides what to run and cleans what comes back.
//
//   connect({id, origin, url, who})              -> {ok: true, name} | {ok: false, cancelled: true}
//        A full-screen sign-in page on the school's own site (its single sign-on and MFA included). The page address is always shown. Done when the
//        script `who` (run inside that page) returns a person. Studyboard never sees the password.
//   run({id, origin, url, script, timeoutMs})   -> {ok: true, json} | {needLogin: true} | {error}
//        Loads `url` in a hidden web view that shares that platform's sign-in, checks it is still on `origin` (if not, you are signed out), runs `script` there
//        (it may return a promise) and gives back its result as JSON text.
//   signOut({id, origin})                         -> {}
//        Forgets that platform's sign-in.
//
// Safety rules (mirror lms.js): https only; the sign-in and hidden views never get camera, microphone or location; nothing in the web view can call
// back into the app (no script message handlers are added); only GET requests are ever made by the scripts the page sends (they are the desktop app's).
// Register in MainViewController: bridge?.registerPluginInstance(StudyboardLmsPlugin())
import Foundation
import UIKit
import WebKit
import Capacitor

private let sbSafariUA = "Version/17.0 Mobile/15E148 Safari/604.1"     // some sign-in pages turn away a web view with no browser name in its user agent

// One private sign-in store per platform (iOS 17+); older systems share the default store and forget by site.
private let sbStoreIds: [String: UUID] = [
    "brightspace": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B01")!,
    "canvas": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B02")!,
    "blackboard": UUID(uuidString: "5B7C2A10-8E0B-4C44-9D63-0A1D4F6E7B03")!
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

// Navigation and permission rules shared by the sign-in view and the hidden view.
private class SBGuard: NSObject, WKNavigationDelegate, WKUIDelegate {
    var onFinish: (() -> Void)?
    var onFail: (() -> Void)?
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let s = navigationAction.request.url?.scheme?.lowercased() ?? ""
        decisionHandler(s == "https" || s == "about" ? .allow : .cancel)             // never http, file, custom schemes or app links
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { onFinish?() }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { onFail?() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { onFail?() }
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) { decisionHandler(.deny) }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let u = navigationAction.request.url, u.scheme == "https" { webView.load(navigationAction.request) }     // pop-ups (sign-in providers) open in the same view
        return nil
    }
}

private func sbEval(_ wv: WKWebView, _ expr: String, _ done: @escaping (Any?) -> Void) {
    // `expr` is an expression that may return a promise (an async arrow function called at once). Result is JSON text, or nil.
    let body = "const v = await (\(expr)); return JSON.stringify(v === undefined ? null : v);"
    wv.callAsyncJavaScript(body, arguments: [:], in: nil, in: .page) { r in
        if case .success(let v) = r { done(v) } else { done(nil) }
    }
}

// The visible sign-in screen.
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
        // The address of whatever is on screen is always shown, never a title the page picks, so it is clear which site a password goes into.
        webView.addObserver(self, forKeyPath: "URL", options: [.new], context: nil)
        webView.load(URLRequest(url: startURL))
        timer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [weak self] _ in self?.check() }
    }
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "URL" { hostLabel.text = webView.url?.host ?? "" }
    }
    func check() {
        guard !finished, sbOrigin(webView.url) == origin else { return }                 // only when the school's own page is on screen
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

// One hidden page load plus script run.
private class SBRun {
    let wv: WKWebView, guardDelegate = SBGuard()
    var done = false
    init(id: String, host: UIView) {
        wv = WKWebView(frame: CGRect(x: 0, y: 0, width: 360, height: 640), configuration: sbConfig(id))
        wv.alpha = 0.01; wv.isUserInteractionEnabled = false
        wv.navigationDelegate = guardDelegate; wv.uiDelegate = guardDelegate
        host.insertSubview(wv, at: 0)               // kept in the view tree (nearly invisible) so iOS does not pause it
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
        guard let c = checked(call), let who = call.getString("who"), who.count < 4000 else { return }
        DispatchQueue.main.async {
            guard let top = self.bridge?.viewController else { return call.reject("no-view") }
            let vc = SBSignInController(id: c.id, origin: c.origin, url: c.url, who: who)
            vc.completion = { call.resolve($0) }
            top.present(vc, animated: true)
        }
    }

    @objc func run(_ call: CAPPluginCall) {
        guard let c = checked(call), let script = call.getString("script"), script.count < 400_000 else { return }
        let ms = max(5, min(180, (call.getDouble("timeoutMs") ?? 60000) / 1000))
        DispatchQueue.main.async {
            guard let host = self.bridge?.viewController?.view else { return call.reject("no-view") }
            let r = SBRun(id: c.id, host: host)
            let reply: ([String: Any]) -> Void = { call.resolve($0) }
            DispatchQueue.main.asyncAfter(deadline: .now() + ms) { r.finish(["error": "timeout"], reply) }
            let go = { [weak r] in
                guard let r = r, !r.done else { return }
                if sbOrigin(r.wv.url) != c.origin { return r.finish(["needLogin": true], reply) }          // sent to a sign-in page (or elsewhere): not signed in
                sbEval(r.wv, script) { v in
                    if let s = v as? String { r.finish(["ok": true, "json": s], reply) } else { r.finish(["error": "script-failed"], reply) }
                }
            }
            r.guardDelegate.onFinish = go
            r.guardDelegate.onFail = go            // a non-HTML page or a redirect can report a failure; the origin check above decides
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
                // The shared store holds everything: remove only this school's records.
                store.fetchDataRecords(ofTypes: types) { records in
                    let mine = records.filter { !host.isEmpty && (host.hasSuffix($0.displayName) || $0.displayName.hasSuffix(host)) }
                    store.removeData(ofTypes: types, for: mine) { call.resolve() }
                }
            }
        }
    }
}
