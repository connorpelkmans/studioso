// UNTESTED: written without compiler access
import Foundation
import Security

enum SBCaptureConfig {
    static let appGroupID = "group.com.studyboardapp.studyboard"
    static let keychainService = "com.studyboardapp.studyboard.capture"
    // Keychain access group = "<TeamID>.com.studyboardapp.studyboard.shared"
    static let keychainAccessGroupInfoKey = "SBKeychainAccessGroup"
    static let path = "/functions/v1/capture-task"
    static let hostSuffix = ".supabase.co"
    static let timeoutSeconds: TimeInterval = 8
    static let maxTextLength = 500
    static let maxDueLength = 64
    static let maxCourseLength = 80
    static let allowedSources: Set<String> = ["siri", "shortcut", "share", "android-share", "gemini", "tile", "bixby", "http", "app"]
}

struct PendingCapture: Codable {
    var id: String = UUID().uuidString
    var kind: String = "task"
    var text: String? = nil
    var due: String? = nil
    var course: String? = nil
    var source: String? = nil
    var url: String? = nil
    var imageFile: String? = nil
    var createdAt: Double = Date().timeIntervalSince1970 * 1000

    // Explicit keys
    enum CodingKeys: String, CodingKey {
        case id, kind, text, due, course, source, url, imageFile, createdAt
    }

    // Trimmed copies that respect the contract limits
    func sanitized() -> PendingCapture? {
        func clip(_ s: String?, _ n: Int) -> String? {
            guard let t = s?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return nil }
            return String(t.prefix(n))
        }
        var c = self
        c.text = clip(text, SBCaptureConfig.maxTextLength)
        c.due = clip(due, SBCaptureConfig.maxDueLength)
        c.course = clip(course, SBCaptureConfig.maxCourseLength)
        if let s = source, !SBCaptureConfig.allowedSources.contains(s) { c.source = nil }
        return c.text == nil ? nil : c
    }
}

// Tolerant decoding
extension PendingCapture {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        func str(_ k: CodingKeys) -> String? {
            guard let v = try? c.decodeIfPresent(String.self, forKey: k) else { return nil }
            return v
        }
        self.init()
        if let v = str(.id), !v.isEmpty { id = v }
        if let v = str(.kind), v == "task" || v == "route" { kind = v }
        text = str(.text)
        due = str(.due)
        course = str(.course)
        source = str(.source)
        url = str(.url)
        imageFile = str(.imageFile)
        if let d = try? c.decodeIfPresent(Double.self, forKey: .createdAt), d.isFinite, d > 0 { createdAt = d }
    }
}

struct CaptureResponse: Decodable {
    var ok: Bool
    var message: String?
    var speech: String?
}

enum CaptureError: Error {
    case notConfigured
    case invalidInput
    case network
    case rejected(Int)
    case badResponse
}

enum SBCapture {
    // MARK: Keychain (shared access group)

    private static func baseQuery(account: String) -> [String: Any] {
        var q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: SBCaptureConfig.keychainService,
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: kCFBooleanFalse as Any
        ]
        if let group = Bundle.main.object(forInfoDictionaryKey: SBCaptureConfig.keychainAccessGroupInfoKey) as? String,
           !group.isEmpty, !group.contains("$(") {
            q[kSecAttrAccessGroup as String] = group
        } else {
            assertionFailure("SBKeychainAccessGroup missing from Info.plist")
        }
        return q
    }

    private static func keychainSet(_ value: String, account: String) -> Bool {
        SecItemDelete(baseQuery(account: account) as CFDictionary)
        var q = baseQuery(account: account)
        q[kSecValueData as String] = Data(value.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }

    private static func keychainGet(account: String) -> String? {
        var q = baseQuery(account: account)
        q[kSecReturnData as String] = kCFBooleanTrue
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }

    static func saveCredentials(token: String, endpoint: String) -> Bool {
        guard validatedEndpoint(endpoint) != nil else { return false }
        return keychainSet(token, account: "token") && keychainSet(endpoint, account: "endpoint")
    }

    static func clearCredentials() {
        SecItemDelete(baseQuery(account: "token") as CFDictionary)
        SecItemDelete(baseQuery(account: "endpoint") as CFDictionary)
    }

    static func validatedEndpoint(_ s: String) -> URL? {
        guard let u = URL(string: s), u.scheme == "https", u.user == nil, u.password == nil, u.port == nil,
              let host = u.host?.lowercased(), host.hasSuffix(SBCaptureConfig.hostSuffix), u.path == SBCaptureConfig.path else { return nil }
        return u
    }

    // MARK: Network

    // POST one capture
    static func send(_ item: PendingCapture, source: String? = nil) async throws -> CaptureResponse {
        var clean = item
        if let source = source { clean.source = source }
        guard let c = clean.sanitized() else { throw CaptureError.invalidInput }
        guard let token = keychainGet(account: "token"),
              let endpointString = keychainGet(account: "endpoint"),
              let url = validatedEndpoint(endpointString) else { throw CaptureError.notConfigured }

        var body: [String: String] = ["text": c.text ?? ""]
        if let v = c.due { body["due"] = v }
        if let v = c.course { body["course"] = v }
        if let v = c.source { body["source"] = v }

        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: SBCaptureConfig.timeoutSeconds)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(c.id, forHTTPHeaderField: "Idempotency-Key")
        req.httpBody = try JSONSerialization.data(withJSONObject: body, options: [.sortedKeys])

        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = SBCaptureConfig.timeoutSeconds
        cfg.timeoutIntervalForResource = SBCaptureConfig.timeoutSeconds
        cfg.waitsForConnectivity = false
        cfg.httpCookieStorage = nil
        cfg.urlCredentialStorage = nil
        let session = URLSession(configuration: cfg)
        defer { session.finishTasksAndInvalidate() }

        let data: Data, resp: URLResponse
        do { (data, resp) = try await session.data(for: req) } catch { throw CaptureError.network }
        guard let http = resp as? HTTPURLResponse else { throw CaptureError.badResponse }
        guard (200..<300).contains(http.statusCode) else { throw CaptureError.rejected(http.statusCode) }
        guard let parsed = try? JSONDecoder().decode(CaptureResponse.self, from: data), parsed.ok else { throw CaptureError.badResponse }
        return parsed
    }

    // MARK: App Group queue (files, no UserDefaults)

    static var queueDirectory: URL? {
        guard let base = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: SBCaptureConfig.appGroupID) else { return nil }
        let dir = base.appendingPathComponent("pending-captures", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        return dir
    }

    @discardableResult
    static func enqueue(_ item: PendingCapture, imageJPEG: Data? = nil) -> Bool {
        guard let dir = queueDirectory else { return false }
        var it = item
        if let img = imageJPEG {
            let name = "\(it.id).jpg"
            guard (try? img.write(to: dir.appendingPathComponent(name), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])) != nil else { return false }
            it.imageFile = name
        }
        guard let data = try? JSONEncoder().encode(it) else { return false }
        return (try? data.write(to: dir.appendingPathComponent("\(it.id).json"), options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])) != nil
    }

    static func enqueueRoute(_ url: String) {
        var it = PendingCapture()
        it.kind = "route"
        it.url = url
        enqueue(it)
    }

    static func pendingItems() -> [PendingCapture] {
        guard let dir = queueDirectory,
              let files = try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) else { return [] }
        return files.filter { $0.pathExtension == "json" }
            .compactMap { file -> PendingCapture? in
                guard let data = try? Data(contentsOf: file), var it = try? JSONDecoder().decode(PendingCapture.self, from: data) else { return nil }
                let stem = file.deletingPathExtension().lastPathComponent
                guard stem.range(of: "^[A-Za-z0-9-]{1,64}$", options: .regularExpression) != nil else { return nil }
                it.id = stem
                return it
            }
            .sorted { $0.createdAt < $1.createdAt }
    }

    static func imageData(for item: PendingCapture) -> Data? {
        guard let dir = queueDirectory, let f = item.imageFile, !f.contains("/") else { return nil }
        return try? Data(contentsOf: dir.appendingPathComponent(f))
    }

    static func remove(id: String) {
        guard let dir = queueDirectory, id.range(of: "^[A-Za-z0-9-]{1,64}$", options: .regularExpression) != nil else { return }
        try? FileManager.default.removeItem(at: dir.appendingPathComponent("\(id).json"))
        try? FileManager.default.removeItem(at: dir.appendingPathComponent("\(id).jpg"))
    }
}
