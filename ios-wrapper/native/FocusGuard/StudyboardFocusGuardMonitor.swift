// UNTESTED: written without compiler access
// The Device Activity monitor extension: iOS runs it at the end of a Focus session (even with Studyboard closed or killed), and it
// takes the shields off. Target: StudyboardFocusGuardMonitor (File > New > Target > Device Activity Monitor Extension), with
// StudyboardFocusGuardShared.swift. Needs the Family Controls entitlement and the App Group, like the app (README-IOS.md 3f).
import DeviceActivity
import ManagedSettings

@available(iOS 16.0, *)
class StudyboardFocusGuardMonitor: DeviceActivityMonitor {
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity == SBFocusGuard.activity else { return }
        ManagedSettingsStore(named: SBFocusGuard.store).clearAllSettings()
        SBFocusGuard.until = 0
    }
}
