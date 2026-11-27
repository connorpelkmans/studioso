// UNTESTED: written without compiler access
// What the Focus Guard plugin (App target) and its Device Activity monitor (the StudyboardFocusGuardMonitor extension) share: the
// names of the shield store and the monitored activity, and the end time, through the App Group.
// Targets: App AND StudyboardFocusGuardMonitor.
import Foundation
#if canImport(ManagedSettings)
import ManagedSettings
import DeviceActivity

@available(iOS 16.0, *)
enum SBFocusGuard {
    static let appGroupID = "group.com.studyboardapp.studyboard"
    static let store = ManagedSettingsStore.Name("studyboardFocus")
    static let activity = DeviceActivityName("studyboardFocus")
    private static var defaults: UserDefaults? { UserDefaults(suiteName: appGroupID) }

    // The session's end (seconds since 1970), so an app opened after a crash or a restart can clear shields that outlived it
    static var until: TimeInterval {
        get { defaults?.double(forKey: "sbFocusGuardUntil") ?? 0 }
        set { defaults?.set(newValue, forKey: "sbFocusGuardUntil") }
    }

    // Everything off: the shields, the monitor, the stored end
    static func clear() {
        ManagedSettingsStore(named: store).clearAllSettings()
        DeviceActivityCenter().stopMonitoring([activity])
        until = 0
    }
}
#endif
