// UNTESTED: written without compiler access
import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StudyboardCaptureTokenPlugin())
        bridge?.registerPluginInstance(StudyboardSharedQueuePlugin())
        bridge?.registerPluginInstance(StudyboardLmsPlugin())
        bridge?.registerPluginInstance(StudyboardFocusActivityPlugin())
        // The page can't be pulled past its top or bottom (it handles the notch and home bar itself, contentInset "never")
        bridge?.webView?.scrollView.bounces = false
        bridge?.webView?.scrollView.contentInsetAdjustmentBehavior = .never
        let idiom = UIDevice.current.userInterfaceIdiom == .pad ? "pad" : "phone"
        let js = "window.StudyboardDevice = Object.freeze({idiom: \"\(idiom)\"});"
        bridge?.webView?.configuration.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // The page says its background colour (native-bridge.js, "sbBg"), so the app's own frame behind it matches the theme:
        // no dark strip shows while the app grows back after the keyboard closes
        bridge?.webView?.configuration.userContentController.add(self, name: "sbBg")
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "sbBg", let hex = message.body as? String, let colour = MainViewController.colour(hex) else { return }
        view.backgroundColor = colour
        bridge?.webView?.backgroundColor = colour
        bridge?.webView?.scrollView.backgroundColor = colour
    }

    private static func colour(_ hex: String) -> UIColor? {
        let h = hex.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "#", with: "")
        guard h.count == 6, let v = UInt32(h, radix: 16) else { return nil }
        return UIColor(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}
