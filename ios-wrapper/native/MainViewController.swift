// UNTESTED: written without compiler access
import UIKit
import WebKit
import Capacitor
import AuthenticationServices
import CryptoKit
import StoreKit

class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private var offsetWatch: NSKeyValueObservation?
    private var insetWatch: NSKeyValueObservation?

    override func capacitorDidLoad() {
        // Studyboard's own plugins, each only if its file is in the project (so this file builds whatever you've added)
        for name in ["StudyboardFocusActivityPlugin", "StudyboardCaptureTokenPlugin", "StudyboardSharedQueuePlugin", "StudyboardLmsPlugin", "StudyboardSignInPlugin", "StudyboardStorePlugin"] {
            // (ios:stage also lists them for Capacitor, which then connects them itself; never twice)
            if let type = NSClassFromString(name) as? CAPPlugin.Type, let plugin = (type as NSObject.Type).init() as? CAPPlugin,
               bridge?.plugin(withName: (plugin as? CAPBridgedPlugin)?.jsName ?? "") == nil {
                bridge?.registerPluginInstance(plugin)
            }
        }
        guard let webView = bridge?.webView else { return }
        let scroll = webView.scrollView
        // The page can't be pulled past its top or bottom (it handles the notch and home bar itself, contentInset "never")
        scroll.bounces = false
        scroll.contentInsetAdjustmentBehavior = .never
        // iOS moves the page to reveal a text box as the keyboard comes up. For a box in a pinned sheet (the note editor) it
        // pulled the whole page down past its top edge, leaving a gap above the header. The page has already placed the box
        // above the keyboard, so its top edge is held at the top of the screen, always.
        offsetWatch = scroll.observe(\.contentOffset, options: [.new]) { sv, _ in
            if sv.contentOffset.y < 0 { sv.contentOffset = CGPoint(x: sv.contentOffset.x, y: 0) }
        }
        insetWatch = scroll.observe(\.contentInset, options: [.new]) { sv, _ in
            if sv.contentInset.top != 0 { sv.contentInset.top = 0 }
        }
        let idiom = UIDevice.current.userInterfaceIdiom == .pad ? "pad" : "phone"
        let js = "window.StudyboardDevice = Object.freeze({idiom: \"\(idiom)\"});"
        webView.configuration.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // The page says its background colour (native-bridge.js, "sbBg"), so what shows past the page's edges matches the theme
        webView.configuration.userContentController.add(self, name: "sbBg")
        webView.isOpaque = false
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "sbBg", let hex = message.body as? String, let colour = MainViewController.colour(hex) else { return }
        view.backgroundColor = colour
        bridge?.webView?.backgroundColor = .clear
        bridge?.webView?.scrollView.backgroundColor = colour
    }

    private static func colour(_ hex: String) -> UIColor? {
        let h = hex.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "#", with: "")
        guard h.count == 6, let v = UInt32(h, radix: 16) else { return nil }
        return UIColor(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}

// Sign in with Apple (Apple's own sheet, with Face ID) and Sign in with Google (Apple's secure sign-in window; Google refuses
// sign-in inside an app's own web view). The page turns what comes back into a Supabase session (01-accounts.js sbOAuth).
@objc(StudyboardSignInPlugin)
public class StudyboardSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
                                     ASAuthorizationControllerPresentationContextProviding, ASWebAuthenticationPresentationContextProviding {
    public let identifier = "StudyboardSignInPlugin"
    public let jsName = "StudyboardSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "apple", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "web", returnType: CAPPluginReturnPromise)
    ]
    private var appleCall: CAPPluginCall?
    private var rawNonce = ""
    private var webSession: ASWebAuthenticationSession?

    // {idToken, nonce, name} once signed in; {} if cancelled; {error} if it failed
    @objc func apple(_ call: CAPPluginCall) {
        let raw = Self.randomNonce()
        let req = ASAuthorizationAppleIDProvider().createRequest()
        req.requestedScopes = [.fullName, .email]
        req.nonce = Self.sha256(raw)   // Apple signs the hash; Supabase checks it against the raw value
        DispatchQueue.main.async {
            self.appleCall?.resolve([:])
            self.appleCall = call; self.rawNonce = raw
            let c = ASAuthorizationController(authorizationRequests: [req])
            c.delegate = self; c.presentationContextProvider = self
            c.performRequests()
        }
    }
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = appleCall else { return }
        appleCall = nil
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential, let data = cred.identityToken,
              let token = String(data: data, encoding: .utf8) else { return call.resolve(["error": "Apple didn't send a sign-in token."]) }
        // the name only comes the first time someone signs in to the app
        let name = [cred.fullName?.givenName, cred.fullName?.familyName].compactMap { $0 }.joined(separator: " ")
        // Apple's one-time code: the server swaps it for a token it can revoke if the account is ever deleted
        let code = cred.authorizationCode.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        call.resolve(["idToken": token, "nonce": rawNonce, "name": name, "code": code])
    }
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = appleCall else { return }
        appleCall = nil
        if let e = error as? ASAuthorizationError, e.code == .canceled { return call.resolve([:]) }
        call.resolve(["error": error.localizedDescription])
    }

    // Opens the provider's https sign-in page; resolves {url} with the studyboard:// address it returns to, or {} if closed
    @objc func web(_ call: CAPPluginCall) {
        guard let s = call.getString("url"), let url = URL(string: s), url.scheme == "https" else { return call.reject("invalid") }
        DispatchQueue.main.async {
            self.webSession?.cancel()
            // (the plugin lives as long as the app, so holding it here is fine)
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "studyboard") { back, _ in
                self.webSession = nil
                call.resolve(back.map { ["url": $0.absoluteString] } ?? [:])
            }
            session.presentationContextProvider = self
            self.webSession = session
            if !session.start() { self.webSession = nil; call.resolve([:]) }
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor { anchor() }
    public func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor { anchor() }
    private func anchor() -> ASPresentationAnchor { bridge?.viewController?.view.window ?? UIWindow() }

    private static func randomNonce() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
    private static func sha256(_ s: String) -> String { SHA256.hash(data: Data(s.utf8)).map { String(format: "%02x", $0) }.joined() }
}

// The App Store country of the person's Apple account (Apple's three-letter code, such as "USA"). In the United States the
// App Store lets the app send people to buy Pro on the website; everywhere else Pro is bought with in-app purchase.
@objc(StudyboardStorePlugin)
public class StudyboardStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardStorePlugin"
    public let jsName = "StudyboardStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storefront", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "linkEligible", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "linkTokens", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "linkNotice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openBrowser", returnType: CAPPluginReturnPromise)
    ]

    // {country: "USA"}, or {} when the App Store can't say (no account signed in, offline at first launch)
    @objc func storefront(_ call: CAPPluginCall) {
        if #available(iOS 15.0, *) {
            Task {
                if let code = await Storefront.current?.countryCode { return call.resolve(["country": code]) }
                call.resolve(SKPaymentQueue.default().storefront.map { ["country": $0.countryCode] } ?? [:])
            }
        } else {
            call.resolve(SKPaymentQueue.default().storefront.map { ["country": $0.countryCode] } ?? [:])
        }
    }

    // EU: the website as a second way to buy Pro, next to in-app purchase, under Apple's "External Purchases or Offers"
    // entitlement (com.apple.developer.storekit.custom-purchase-link.allowed-regions). Apple's order: the person can make
    // payments, the app is eligible here, Apple's own disclosure sheet when they tap, and only then the website. Needs
    // iOS 26.2 (Apple's minimum for the EU); everything here answers "no" without the entitlement.

    // {value: true} when the website may be offered on this device and App Store country
    @objc func linkEligible(_ call: CAPPluginCall) {
        guard #available(iOS 26.2, *), SKPaymentQueue.canMakePayments() else { return call.resolve(["value": false]) }
        Task { call.resolve(["value": await ExternalPurchaseCustomLink.isEligible]) }
    }

    // Apple's tokens for reporting website sales: {tokens: ["<base64url JSON>", ...]} (the acquisition and services ones
    // that are active; Apple asks for them at launch and before every possible purchase)
    @objc func linkTokens(_ call: CAPPluginCall) {
        guard #available(iOS 26.2, *) else { return call.resolve(["tokens": []]) }
        Task {
            guard await ExternalPurchaseCustomLink.isEligible else { return call.resolve(["tokens": []]) }
            var out: [String] = []
            for type in ["ACQUISITION", "SERVICES"] {
                if let t = try? await ExternalPurchaseCustomLink.token(for: type) { out.append(t.value) }
            }
            call.resolve(["tokens": out])
        }
    }

    // Apple's disclosure sheet, shown when the person taps the website option: {result: "continued" | "cancelled" | "unavailable"}
    @objc func linkNotice(_ call: CAPPluginCall) {
        guard #available(iOS 26.2, *), SKPaymentQueue.canMakePayments() else { return call.resolve(["result": "unavailable"]) }
        Task { @MainActor in
            guard await ExternalPurchaseCustomLink.isEligible else { return call.resolve(["result": "unavailable"]) }
            do {
                let r = try await ExternalPurchaseCustomLink.showNotice(type: .browser)
                call.resolve(["result": r == .continued ? "continued" : "cancelled"])
            } catch {
                call.resolve(["result": "unavailable"])
            }
        }
    }

    // The website in the person's own browser (the disclosure sheet said they're leaving the app)
    @objc func openBrowser(_ call: CAPPluginCall) {
        guard let s = call.getString("url"), let url = URL(string: s), url.scheme == "https" else { return call.reject("invalid") }
        DispatchQueue.main.async { UIApplication.shared.open(url) { ok in call.resolve(["value": ok]) } }
    }
}

