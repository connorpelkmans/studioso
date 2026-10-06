// UNTESTED: written without compiler access. App Target. Registers the two local plugins (Capacitor 6/7: local plugins are registered by instance).
// Xcode: set the custom class of the view controller in Main.storyboard to MainViewController (Module: App). Verify against your Capacitor version's docs
// ("Custom Native iOS Code" / registerPluginInstance); older versions use a .m file with CAP_PLUGIN instead.
import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StudyboardCaptureTokenPlugin())
        bridge?.registerPluginInstance(StudyboardSharedQueuePlugin())
        bridge?.registerPluginInstance(StudyboardLmsPlugin())          // school site sign-in and sync (StudyboardLms.swift)
    }
}
