// UNTESTED: written without compiler access. App Target. Registers the two local plugins (Capacitor 6/7: local plugins are registered by instance).
// Xcode: set the custom class of the view controller in Main.storyboard to MainViewController (Module: App). Verify against your Capacitor version's docs
// ("Custom Native iOS Code" / registerPluginInstance); older versions use a .m file with CAP_PLUGIN instead.
import UIKit
import WebKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StudyboardCaptureTokenPlugin())
        bridge?.registerPluginInstance(StudyboardSharedQueuePlugin())
        bridge?.registerPluginInstance(StudyboardLmsPlugin())          // school site sign-in and sync (StudyboardLms.swift)
        bridge?.registerPluginInstance(StudyboardFocusActivityPlugin()) // the Focus timer in the Dynamic Island (FocusActivity/)
        // Tells the page whether this is an iPad or an iPhone before any of its script runs. The pen tools (handwriting on PDFs and notes)
        // are iPad only: index.html SBINK.available(). Without this line the page falls back to the user agent.
        let idiom = UIDevice.current.userInterfaceIdiom == .pad ? "pad" : "phone"
        let js = "window.StudyboardDevice = Object.freeze({idiom: \"\(idiom)\"});"
        bridge?.webView?.configuration.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }
}
