// UNTESTED: written without compiler access or a device
// Shared by the App target and the StudyboardSafari extension target (add this file to both).
//
// Schools that sign in with Google: Google refuses its sign-in inside an app's own web view, so the student signs in
// in Safari instead. Studyboard's Safari extension (ios-wrapper/native/SchoolSafari/SafariWebExtensionHandler.swift)
// then hands the school site's own session (its cookies, never a Google cookie or password) to the app, which keeps
// syncing in its hidden web view as before. Nothing leaves the phone.
import Foundation
import Security

enum SBSchoolHandoff {
    static let appGroupID = "group.com.studyboardapp.studyboard"
    static let keychainService = "com.studyboardapp.studyboard.school-handoff"
    // Same Info.plist key and keychain group as quick capture (SBCapture.swift): "<TeamID>.com.studyboardapp.studyboard.shared"
    static let keychainAccessGroupInfoKey = "SBKeychainAccessGroup"
    static let platforms: Set<String> = ["brightspace", "canvas", "blackboard", "moodle"]
    // A handed-over sign-in is used within a day or thrown away
    static let maxAge: TimeInterval = 24 * 3600
    static let maxCookies = 150

    private static let wantedKey = "sbSchoolSafariWanted"
    private static let seenKey = "sbSchoolSafariSeen"
    private static let grantedKey = "sbSchoolSafariGranted"

    // need: the app has no working sign-in for this site right now (Safari hands one over as soon as it has one);
    // otherwise Safari refreshes the app's sign-in now and then, when the student has the site open there anyway
    struct Wanted: Codable { var origin: String; var need: Bool; var at: Double }

    struct Cookie: Codable {
        var name: String
        var value: String
        var domain: String
        var path: String
        var secure: Bool
        var httpOnly: Bool
        var hostOnly: Bool
        var sameSite: String?
        var expirationDate: Double?
    }
    struct Handoff: Codable { var v: Int; var id: String; var origin: String; var at: Double; var cookies: [Cookie] }

    private static var defaults: UserDefaults? { UserDefaults(suiteName: appGroupID) }
    private static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

    // "https://host" or "https://host:port", exactly
    static func origin(of s: String) -> String? {
        guard let u = URL(string: s), u.scheme == "https", let h = u.host, !h.isEmpty, u.user == nil, u.password == nil,
              u.path.isEmpty, u.query == nil, u.fragment == nil else { return nil }
        let port = (u.port != nil && u.port != 443) ? ":\(u.port!)" : ""
        let o = "https://\(h.lowercased())\(port)"
        return o == s ? o : nil
    }
    private static func host(of origin: String) -> String { URL(string: origin)?.host?.lowercased() ?? "" }

    // MARK: Which sites the app wants a Safari sign-in for (App Group, not secret)

    static func wanted() -> [String: Wanted] {
        guard let d = defaults?.data(forKey: wantedKey), let w = try? JSONDecoder().decode([String: Wanted].self, from: d) else { return [:] }
        return w.filter { platforms.contains($0.key) && origin(of: $0.value.origin) != nil }
    }
    private static func saveWanted(_ w: [String: Wanted]) {
        if let d = try? JSONEncoder().encode(w) { defaults?.set(d, forKey: wantedKey) }
    }
    static func setWanted(_ id: String, origin o: String, need: Bool) {
        guard platforms.contains(id), origin(of: o) != nil else { return }
        var w = wanted()
        w[id] = Wanted(origin: o, need: need, at: nowMs)
        saveWanted(w)
    }
    static func isWanted(_ id: String, origin o: String) -> Bool { wanted()[id]?.origin == o }
    static func clear(_ id: String) {
        var w = wanted()
        w.removeValue(forKey: id)
        saveWanted(w)
        keychainDelete(account: id)
    }

    // MARK: Whether the extension is switched on, and on which of the wanted sites Safari lets it read

    // Called by the extension each time it asks what's wanted (it can only ask while it's switched on)
    static func markSeen(granted patterns: [String]) {
        defaults?.set(Date().timeIntervalSince1970, forKey: seenKey)
        let wantedOrigins = Set(wanted().values.map { $0.origin })
        let granted = patterns.prefix(500).compactMap { p -> String? in
            let o = p.hasSuffix("/*") ? String(p.dropLast(2)) : p
            return wantedOrigins.contains(o) ? o : nil
        }
        defaults?.set(Array(Set(granted)), forKey: grantedKey)
    }
    static func extensionSeen() -> Bool { (defaults?.double(forKey: seenKey) ?? 0) > 0 }
    static func extensionAllowed(on o: String) -> Bool { (defaults?.stringArray(forKey: grantedKey) ?? []).contains(o) }

    // MARK: The sign-in itself (keychain, this device only)

    static func cookieFits(_ c: Cookie, host: String) -> Bool {
        guard !c.name.isEmpty, c.name.utf8.count <= 256, c.value.utf8.count <= 8192,
              c.path.hasPrefix("/"), c.path.utf8.count <= 1024, !host.isEmpty else { return false }
        var d = c.domain.lowercased()
        if d.hasPrefix(".") { d.removeFirst() }
        if d.isEmpty { return false }
        if c.hostOnly { return d == host }
        return host == d || host.hasSuffix("." + d)
    }

    // Extension side: keep a sign-in for a site the app asked about
    static func store(_ h: Handoff) -> Bool {
        guard h.v == 1, platforms.contains(h.id), let o = origin(of: h.origin), isWanted(h.id, origin: o),
              !h.cookies.isEmpty, h.cookies.count <= maxCookies else { return false }
        let host = host(of: o)
        let keep = h.cookies.filter { cookieFits($0, host: host) }
        guard !keep.isEmpty else { return false }
        let clean = Handoff(v: 1, id: h.id, origin: o, at: nowMs, cookies: keep)
        guard let data = try? JSONEncoder().encode(clean), keychainSet(data, account: h.id) else { return false }
        setWanted(h.id, origin: o, need: false)
        return true
    }

    // App side: the waiting sign-in for this site, read once (it's deleted as it's read)
    static func take(_ id: String, origin o: String) -> [Cookie]? {
        guard platforms.contains(id), let data = keychainGet(account: id) else { return nil }
        keychainDelete(account: id)
        guard let h = try? JSONDecoder().decode(Handoff.self, from: data), h.v == 1, h.id == id, h.origin == o,
              nowMs - h.at < maxAge * 1000, h.at <= nowMs + 60_000 else { return nil }
        let host = host(of: o)
        let keep = h.cookies.prefix(maxCookies).filter { cookieFits($0, host: host) }
        return keep.isEmpty ? nil : Array(keep)
    }
    static func waiting(_ id: String) -> Bool { keychainGet(account: id) != nil }

    // MARK: The app's own sign-in, copied for the background check (StudyboardSchoolBackground.swift reads school sites without a
    // web view, which iOS may pause in the background). Keychain, this device only; the account isn't shared with the extension's.

    struct Snapshot: Codable { var v: Int; var origin: String; var at: Double; var cookies: [Cookie] }
    static func saveSnapshot(_ id: String, origin o: String, _ cookies: [Cookie]) {
        guard platforms.contains(id), origin(of: o) != nil else { return }
        let keep = Array(cookies.filter { cookieFits($0, host: host(of: o)) }.prefix(maxCookies))
        guard !keep.isEmpty, let d = try? JSONEncoder().encode(Snapshot(v: 1, origin: o, at: nowMs, cookies: keep)) else { return }
        _ = keychainSet(d, account: "snap-" + id)
    }
    static func snapshot(_ id: String, origin o: String) -> Snapshot? {
        guard platforms.contains(id), let d = keychainGet(account: "snap-" + id),
              let s = try? JSONDecoder().decode(Snapshot.self, from: d), s.v == 1, s.origin == o else { return nil }
        return s
    }

    // MARK: What the extension last read from a school site in Safari (App Group file; used when the app's own sign-in has run out)

    static let maxResultBytes = 6_000_000
    private static func resultURL(_ id: String) -> URL? {
        guard platforms.contains(id) else { return nil }
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID)?.appendingPathComponent("school-result-\(id).json")
    }
    // Extension side: {v: 1, id, origin, at, h}, only for a site the app asked for
    static func storeResult(_ m: [String: Any]) -> Bool {
        guard let id = m["id"] as? String, let o = m["origin"] as? String, origin(of: o) == o, isWanted(id, origin: o),
              let at = (m["at"] as? NSNumber)?.doubleValue, abs(at - nowMs) < 3_600_000, m["h"] is [String: Any],
              let url = resultURL(id) else { return false }
        let keep: [String: Any] = ["v": 1, "id": id, "origin": o, "at": at, "h": m["h"]!]
        guard JSONSerialization.isValidJSONObject(keep), let d = try? JSONSerialization.data(withJSONObject: keep), d.count <= maxResultBytes else { return false }
        return (try? d.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])) != nil
    }
    // App side: the read (as JSON text) and when it was made, if it's for this site
    static func result(_ id: String, origin o: String) -> (at: Double, json: String)? {
        guard let url = resultURL(id), let d = try? Data(contentsOf: url), d.count <= maxResultBytes,
              let m = try? JSONSerialization.jsonObject(with: d) as? [String: Any], (m["v"] as? NSNumber)?.intValue == 1,
              m["id"] as? String == id, m["origin"] as? String == o, let at = (m["at"] as? NSNumber)?.doubleValue,
              let h = m["h"], let hd = try? JSONSerialization.data(withJSONObject: h), let text = String(data: hd, encoding: .utf8) else { return nil }
        return (at, text)
    }

    // Signing out of a school site on this iPhone: everything kept for it goes
    static func forget(_ id: String) {
        clear(id)
        keychainDelete(account: "snap-" + id)
        if let url = resultURL(id) { try? FileManager.default.removeItem(at: url) }
    }

    // MARK: Keychain (shared access group, like SBCapture.swift)

    private static func baseQuery(account: String) -> [String: Any] {
        var q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: kCFBooleanFalse as Any
        ]
        if let group = Bundle.main.object(forInfoDictionaryKey: keychainAccessGroupInfoKey) as? String,
           !group.isEmpty, !group.contains("$(") {
            q[kSecAttrAccessGroup as String] = group
        } else {
            assertionFailure("SBKeychainAccessGroup missing from Info.plist")
        }
        return q
    }
    private static func keychainSet(_ value: Data, account: String) -> Bool {
        SecItemDelete(baseQuery(account: account) as CFDictionary)
        var q = baseQuery(account: account)
        q[kSecValueData as String] = value
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }
    private static func keychainGet(account: String) -> Data? {
        var q = baseQuery(account: account)
        q[kSecReturnData as String] = kCFBooleanTrue
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess else { return nil }
        return out as? Data
    }
    private static func keychainDelete(account: String) {
        SecItemDelete(baseQuery(account: account) as CFDictionary)
    }
}
