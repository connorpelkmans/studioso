// UNTESTED: written without compiler access. Share Extension target ("StudyboardShare"), iOS 16+. Also add SBCapture.swift to this target.
//
// Takes shared text / a web URL / one image.
//   text or URL only -> POST to the capture endpoint (source "share"); on any failure it is queued in the App Group container.
//   image            -> saved (downscaled JPEG) with any text into the App Group queue. Extensions cannot reliably open the host app, so the
//                       person finishes by opening Studyboard: the app drains the queue on launch/resume (StudyboardSharedQueue plugin).
import UIKit
import UniformTypeIdentifiers
import ImageIO

final class ShareViewController: UIViewController {
    private let label = UILabel()
    private static let maxImageBytes = 8 * 1024 * 1024
    private static let maxImagePixels = 2048

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.systemBackground.withAlphaComponent(0.95)
        label.text = "Adding to Studyboard..."
        label.textAlignment = .center
        label.numberOfLines = 0
        label.font = .preferredFont(forTextStyle: .headline)
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24)
        ])
        Task { await handle() }
    }

    private func handle() async {
        let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
        var text: String?
        var url: String?
        var image: Data?

        for p in providers {
            if text == nil, p.hasItemConformingToTypeIdentifier(UTType.plainText.identifier),
               let s = await load(p, UTType.plainText.identifier) as? String { text = s }
            if url == nil, p.hasItemConformingToTypeIdentifier(UTType.url.identifier),
               let u = await load(p, UTType.url.identifier) as? URL, u.scheme == "https" || u.scheme == "http" { url = u.absoluteString }
            if image == nil, p.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                image = await loadImage(p)
            }
        }

        // One line for the task: the shared text, else the URL. If both exist (Safari shares title + URL), keep both.
        let combined = [text, url].compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: " ")
        var item = PendingCapture(text: combined.isEmpty ? (image != nil ? "Photo from share sheet" : nil) : combined, source: "share")
        guard let clean = item.sanitized() else { return finish("Nothing to add.") }
        item = clean

        if let img = image {
            let ok = SBCapture.enqueue(item, imageJPEG: img)
            return finish(ok ? "Saved. Open Studyboard to finish adding the photo." : "Couldn't save the photo.")
        }
        do {
            _ = try await SBCapture.send(item)
            finish("Added to Studyboard")
        } catch {
            let ok = SBCapture.enqueue(item)
            finish(ok ? "Saved. It will be added when you open Studyboard." : "Couldn't add it.")
        }
    }

    private func load(_ p: NSItemProvider, _ type: String) async -> NSSecureCoding? {
        await withCheckedContinuation { cont in
            p.loadItem(forTypeIdentifier: type, options: nil) { item, _ in cont.resume(returning: item) }
        }
    }

    /// Returns a JPEG no larger than 2048 px / 8 MB, or nil. Handles file URLs, UIImage and raw Data.
    private func loadImage(_ p: NSItemProvider) async -> Data? {
        let item = await load(p, UTType.image.identifier)
        var source: CGImageSource?
        if let u = item as? URL { source = CGImageSourceCreateWithURL(u as CFURL, nil) }
        else if let d = item as? Data { source = CGImageSourceCreateWithData(d as CFData, nil) }
        else if let i = item as? UIImage, let d = i.jpegData(compressionQuality: 0.9) { source = CGImageSourceCreateWithData(d as CFData, nil) }
        guard let src = source else { return nil }
        let opts: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: Self.maxImagePixels
        ]
        guard let cg = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) else { return nil }
        for q in [0.8, 0.6, 0.4] {
            if let d = UIImage(cgImage: cg).jpegData(compressionQuality: q), d.count <= Self.maxImageBytes { return d }
        }
        return nil
    }

    @MainActor
    private func finish(_ message: String) {
        label.text = message
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}
