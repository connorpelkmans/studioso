// UNTESTED: written without compiler access
import UIKit
import WebKit
import AVFoundation
import Capacitor

class MainViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private var offsetWatch: NSKeyValueObservation?
    private var insetWatch: NSKeyValueObservation?

    override func capacitorDidLoad() {
        // Studyboard's own plugins, each only if its file is in the project (so this file builds whatever you've added)
        for name in ["StudyboardFocusActivityPlugin", "StudyboardCaptureTokenPlugin", "StudyboardSharedQueuePlugin", "StudyboardLmsPlugin"] {
            // (ios:stage also lists them for Capacitor, which then connects them itself; never twice)
            if let type = NSClassFromString(name) as? CAPPlugin.Type, let plugin = (type as NSObject.Type).init() as? CAPPlugin,
               bridge?.plugin(withName: (plugin as? CAPBridgedPlugin)?.jsName ?? "") == nil {
                bridge?.registerPluginInstance(plugin)
            }
        }
        // The page's sounds (the focus alarm, its test) play like a timer app's: heard with the ring switch on silent, mixed
        // with any music rather than stopping it
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
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
