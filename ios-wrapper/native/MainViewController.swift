// UNTESTED: written without compiler access
import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController {
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
    }
}
