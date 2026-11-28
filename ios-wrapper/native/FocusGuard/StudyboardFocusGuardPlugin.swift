// UNTESTED: written without compiler access
// "Block distracting apps" during a Focus session on iPhone and iPad: Screen Time shields (ManagedSettings) on the apps, categories
// and sites the student picks once with Apple's FamilyActivityPicker, from the session's start until its end. A Device Activity
// monitor (StudyboardFocusGuardMonitor.swift, its own extension) takes them off at the end time even if Studyboard is closed; the
// app also clears them when it opens after that time.
//
// Shipping it needs Apple's Family Controls entitlement (com.apple.developer.family-controls), which Apple grants on request
// (README-IOS.md 3f). Until then leave StudyboardFamilyControls out of Info.plist (or false): available() then says apps: false, and
// the page hides the setting. Target: App, with StudyboardFocusGuardShared.swift.
//
// JS (native-bridge.js section 12, window.StudyboardNative.focusGuard), plugin "StudyboardFocusGuard":
//   available()               -> {dnd: false, apps}
//   pickApps()                -> {value}   asks for Screen Time access the first time, then shows the picker; true when something is picked
//   start({until, apps, dnd}) -> {value}   shields on until `until` (ms since 1970)
//   stop()                    -> {value}
import Foundation
import Capacitor
import SwiftUI
#if canImport(FamilyControls)
import FamilyControls
import ManagedSettings
import DeviceActivity
#endif

@objc(StudyboardFocusGuardPlugin)
public class StudyboardFocusGuardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StudyboardFocusGuardPlugin"
    public let jsName = "StudyboardFocusGuard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    private static let selectionKey = "sbFocusGuardSelection"

    // Set to true in Info.plist once Apple has granted the Family Controls entitlement and it is in App.entitlements
    private var enabled: Bool { Bundle.main.object(forInfoDictionaryKey: "StudyboardFamilyControls") as? Bool == true }

    public override func load() {
        // a session that ended while the app was closed (and the monitor didn't run): shields off
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *), enabled, SBFocusGuard.until > 0, SBFocusGuard.until <= Date().timeIntervalSince1970 { SBFocusGuard.clear() }
        #endif
    }

    @objc func available(_ call: CAPPluginCall) {
        var apps = false
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) { apps = enabled }
        #endif
        call.resolve(["dnd": false, "apps": apps])
    }

    @objc func pickApps(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        guard #available(iOS 16.0, *), enabled else { return call.resolve(["value": false]) }
        Task { @MainActor in
            do {
                if AuthorizationCenter.shared.authorizationStatus != .approved {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                }
            } catch {
                return call.resolve(["value": false])
            }
            guard AuthorizationCenter.shared.authorizationStatus == .approved, let vc = self.bridge?.viewController else { return call.resolve(["value": false]) }
            let host = UIHostingController(rootView: SBFocusGuardPicker(selection: Self.loadSelection() ?? FamilyActivitySelection()) { picked in
                vc.dismiss(animated: true)
                guard let picked = picked else { return call.resolve(["value": Self.hasSelection(Self.loadSelection())]) }
                Self.saveSelection(picked)
                call.resolve(["value": Self.hasSelection(picked)])
            })
            host.modalPresentationStyle = .pageSheet
            vc.present(host, animated: true)
        }
        #else
        call.resolve(["value": false])
        #endif
    }

    @objc func start(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        guard #available(iOS 16.0, *), enabled, call.getBool("apps") == true,
              AuthorizationCenter.shared.authorizationStatus == .approved,
              let sel = Self.loadSelection(), Self.hasSelection(sel) else { return call.resolve(["value": false]) }
        let until = (call.getDouble("until") ?? 0) / 1000, now = Date().timeIntervalSince1970
        guard until > now, until - now <= 12 * 3600 else { return call.resolve(["value": false]) }
        let store = ManagedSettingsStore(named: SBFocusGuard.store)
        store.shield.applications = sel.applicationTokens.isEmpty ? nil : sel.applicationTokens
        store.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : .specific(sel.categoryTokens)
        store.shield.webDomains = sel.webDomainTokens.isEmpty ? nil : sel.webDomainTokens
        SBFocusGuard.until = until
        // The monitor takes the shields off at the end. Device Activity schedules must be at least 15 minutes long, so a shorter
        // session's schedule starts earlier (a start in the past begins at once); only its end matters.
        let cal = Calendar.current
        let end = Date(timeIntervalSince1970: until)
        let begin = min(Date(), end.addingTimeInterval(-15 * 60 - 30))
        let comps: (Date) -> DateComponents = { cal.dateComponents([.year, .month, .day, .hour, .minute, .second], from: $0) }
        do {
            DeviceActivityCenter().stopMonitoring([SBFocusGuard.activity])
            try DeviceActivityCenter().startMonitoring(SBFocusGuard.activity, during: DeviceActivitySchedule(intervalStart: comps(begin), intervalEnd: comps(end), repeats: false))
        } catch {
            // without the monitor the shields would outlast the session if the app is closed: don't block at all
            SBFocusGuard.clear()
            return call.resolve(["value": false])
        }
        call.resolve(["value": true])
        #else
        call.resolve(["value": false])
        #endif
    }

    @objc func stop(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) { SBFocusGuard.clear() }
        #endif
        call.resolve(["value": true])
    }

    #if canImport(FamilyControls)
    @available(iOS 16.0, *)
    private static func hasSelection(_ s: FamilyActivitySelection?) -> Bool {
        guard let s = s else { return false }
        return !s.applicationTokens.isEmpty || !s.categoryTokens.isEmpty || !s.webDomainTokens.isEmpty
    }

    // The picked apps are opaque tokens: Studyboard never learns which apps they are. Kept in the App Group (never synced).
    @available(iOS 16.0, *)
    private static func loadSelection() -> FamilyActivitySelection? {
        guard let raw = UserDefaults(suiteName: SBFocusGuard.appGroupID)?.data(forKey: selectionKey) else { return nil }
        return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: raw)
    }

    @available(iOS 16.0, *)
    private static func saveSelection(_ s: FamilyActivitySelection) {
        if let raw = try? PropertyListEncoder().encode(s) { UserDefaults(suiteName: SBFocusGuard.appGroupID)?.set(raw, forKey: selectionKey) }
    }
    #endif
}

#if canImport(FamilyControls)
// Apple's picker in a sheet with Cancel and Done
@available(iOS 16.0, *)
private struct SBFocusGuardPicker: View {
    @State var selection: FamilyActivitySelection
    let done: (FamilyActivitySelection?) -> Void
    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Apps to Block")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { done(nil) } }
                    ToolbarItem(placement: .confirmationAction) { Button("Done") { done(selection) } }
                }
        }
    }
}
#endif
