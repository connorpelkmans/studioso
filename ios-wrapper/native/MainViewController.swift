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
        let idiom = UIDevice.current.userInterfaceIdiom == .pad ? "pad" : "phone"
        let js = "window.StudyboardDevice = Object.freeze({idiom: \"\(idiom)\"});"
        bridge?.webView?.configuration.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }
}
