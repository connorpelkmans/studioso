// UNTESTED on a device (kotlinc type-check against android-all API 34 stubs only). Share target for ACTION_SEND (text/plain, image/*) and
// ACTION_SEND_MULTIPLE (image/*). The activity is exported (any app can start it), so NOTHING is sent or saved without the person's tap:
//   text  -> an AlertDialog shows a preview with "Add to Studyboard" / "Cancel"; only "Add" POSTs to the capture endpoint (CaptureClient,
//            source "android-share"); a Toast reports the result. Failures are retried by CaptureClient's outbox.
//   image -> an AlertDialog asks first; on "Add" the image is decoded (content:// only, never our own providers), EXIF-rotated, downscaled
//            (<= 2048 px, <= 8 MB JPEG), saved in the app's queue, and MainActivity opens; the web app drains it (StudyboardSharedQueue) and shows
//            its own confirm sheet.
// Only the first image of a SEND_MULTIPLE is used (one photo per capture). Theme: translucent (AndroidManifest.additions.xml), so only the dialog shows.
package com.studioso.app.capture

import android.app.Activity
import android.app.AlertDialog
import android.content.ContentResolver
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.util.UUID

class ShareReceiverActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var dialog: AlertDialog? = null
    private var working = false

    companion object {
        private const val MAX_PREVIEW = 300
        private const val MAX_PIXELS = 2048            // long side of the saved JPEG
        private const val MAX_JPEG_BYTES = 8 * 1024 * 1024
        private const val MAX_SOURCE_SIDE = 30_000     // refuse absurd dimensions (decoder bombs) before decoding
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val i = intent
        val type = i?.type ?: ""
        try {
            when {
                i == null -> finish()
                i.action == Intent.ACTION_SEND && type.startsWith("text/") -> confirmText(i)
                i.action == Intent.ACTION_SEND && type.startsWith("image/") ->
                    confirmImage(i.streamUri(), i.extraText(Intent.EXTRA_TEXT))
                i.action == Intent.ACTION_SEND_MULTIPLE && type.startsWith("image/") ->
                    confirmImage(i.streamUris().firstOrNull(), i.extraText(Intent.EXTRA_TEXT))
                else -> finish()
            }
        } catch (e: Exception) {          // malformed extras from another app (BadParcelableException etc.)
            finish()
        }
    }

    // ---------- text ----------

    private fun confirmText(i: Intent) {
        val text = listOfNotNull(i.extraText(Intent.EXTRA_SUBJECT), i.extraText(Intent.EXTRA_TEXT))
            .map { it.trim() }.filter { it.isNotEmpty() }.distinct().joinToString(" ").take(CaptureClient.MAX_TEXT)
        if (text.isEmpty()) { toast("Nothing to add."); finish(); return }
        val preview = if (text.length > MAX_PREVIEW) text.take(MAX_PREVIEW) + "…" else text
        ask("Add to Studyboard?", preview) { sendText(text) }
    }

    private fun sendText(text: String) {
        scope.launch {
            val msg = when (val r = CaptureClient.send(applicationContext, text, source = "android-share")) {
                is CaptureResult.Added -> "Added to Studyboard"
                is CaptureResult.NotConfigured -> if (r.queued) "Saved. Open Studyboard to finish adding it (turn on Quick Capture in Settings to skip this)." else "Couldn't save it."
                CaptureResult.Invalid -> "Nothing to add."
                CaptureResult.Rejected -> "Studyboard couldn't accept that text."
                is CaptureResult.Failed -> if (r.queued) "Saved. It will be added when you're back online." else "Couldn't add it."
            }
            if (msg == "Added to Studyboard") CaptureClient.flushInBackground(applicationContext)   // online now: retry anything older too
            toast(msg)
            finish()
        }
    }

    // ---------- image ----------

    private fun confirmImage(uri: Uri?, text: String?) {
        if (uri == null || !isAllowedStream(uri)) { toast("Couldn't read that image."); finish(); return }
        val caption = text?.trim()?.take(CaptureClient.MAX_TEXT)?.takeIf { it.isNotEmpty() }
        ask("Add this photo to Studyboard?", "Studyboard will open so you can check the task before it is added.") { saveImage(uri, caption) }
    }

    private fun saveImage(uri: Uri, caption: String?) {
        scope.launch {
            val jpeg = withContext(Dispatchers.IO) { downscale(uri) }
            val ok = jpeg != null && withContext(Dispatchers.IO) {
                CaptureQueue.enqueue(applicationContext, UUID.randomUUID().toString(), caption ?: "Photo from share sheet", null, null, "android-share", jpeg)
            }
            if (ok) {
                packageManager.getLaunchIntentForPackage(packageName)
                    ?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    ?.let { startActivity(it) }
            } else {
                toast("Couldn't read that image.")
            }
            finish()
        }
    }

    /** Only content:// URIs from OTHER apps' providers. file:// (path tricks) and our own providers (which could expose this app's private
     *  files, e.g. a FileProvider or a plugin's provider) are refused. The MIME type must be an image. */
    private fun isAllowedStream(uri: Uri): Boolean {
        if (uri.scheme != ContentResolver.SCHEME_CONTENT) return false
        val authority = uri.authority?.lowercase() ?: return false
        if (authority.isEmpty() || ownAuthorities().any { it == authority }) return false
        if (authority == packageName.lowercase() || authority.startsWith(packageName.lowercase() + ".")) return false
        val owner = try {
            @Suppress("DEPRECATION")
            packageManager.resolveContentProvider(authority, 0)?.packageName
        } catch (e: Exception) { null }
        if (owner == packageName) return false
        val mime = try { contentResolver.getType(uri) } catch (e: Exception) { null }
        return mime == null || mime.startsWith("image/")      // some providers return null; the decoder rejects non-images anyway
    }

    private fun ownAuthorities(): Set<String> = try {
        val info = if (Build.VERSION.SDK_INT >= 33) {
            packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(PackageManager.GET_PROVIDERS.toLong()))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getPackageInfo(packageName, PackageManager.GET_PROVIDERS)
        }
        (info.providers ?: emptyArray()).flatMap { p -> (p.authority ?: "").split(';') }
            .map { it.trim().lowercase() }.filter { it.isNotEmpty() }.toSet()
    } catch (e: Exception) { emptySet() }

    /** JPEG <= 2048 px on the long side and <= 8 MB, upright per EXIF, or null. */
    private fun downscale(uri: Uri): ByteArray? {
        var decoded: Bitmap? = null
        var rotated: Bitmap? = null
        return try {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            val w = bounds.outWidth
            val h = bounds.outHeight
            if (w <= 0 || h <= 0 || w > MAX_SOURCE_SIDE || h > MAX_SOURCE_SIDE) return null
            var sample = 1
            while (maxOf(w, h) / sample > MAX_PIXELS) sample *= 2
            decoded = contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
            } ?: return null
            val orientation = try {
                contentResolver.openInputStream(uri)?.use { ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL) }
                    ?: ExifInterface.ORIENTATION_NORMAL
            } catch (e: Exception) { ExifInterface.ORIENTATION_NORMAL }
            rotated = applyOrientation(decoded, orientation)
            val bmp = rotated ?: decoded
            var out: ByteArray? = null
            for (q in intArrayOf(80, 60, 40)) {
                val bos = ByteArrayOutputStream()
                bmp.compress(Bitmap.CompressFormat.JPEG, q, bos)
                if (bos.size() <= MAX_JPEG_BYTES) { out = bos.toByteArray(); break }
            }
            out
        } catch (e: Throwable) {          // includes OutOfMemoryError on a hostile image
            null
        } finally {
            if (rotated != null && rotated !== decoded) rotated.recycle()
            decoded?.recycle()
        }
    }

    /** Returns a new upright bitmap, or null when no transform is needed. */
    private fun applyOrientation(src: Bitmap, orientation: Int): Bitmap? {
        val m = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_ROTATE_180 -> m.postRotate(180f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> m.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> { m.postRotate(90f); m.postScale(-1f, 1f) }
            ExifInterface.ORIENTATION_ROTATE_90 -> m.postRotate(90f)
            ExifInterface.ORIENTATION_TRANSVERSE -> { m.postRotate(-90f); m.postScale(-1f, 1f) }
            ExifInterface.ORIENTATION_ROTATE_270 -> m.postRotate(-90f)
            else -> return null
        }
        return Bitmap.createBitmap(src, 0, 0, src.width, src.height, m, true)
    }

    // ---------- helpers ----------

    private fun ask(title: String, message: String, onAdd: () -> Unit) {
        dialog = AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Add to Studyboard") { _, _ -> working = true; onAdd() }
            .setNegativeButton("Cancel") { _, _ -> finish() }
            .setOnCancelListener { finish() }
            .setOnDismissListener { if (!working && !isFinishing) finish() }
            .show()
    }

    private fun toast(msg: String) = Toast.makeText(applicationContext, msg, Toast.LENGTH_SHORT).show()

    override fun onDestroy() {
        dialog?.setOnDismissListener(null)
        dialog?.dismiss()
        scope.cancel()
        super.onDestroy()
    }

    private fun Intent.extraText(name: String): String? = try { getCharSequenceExtra(name)?.toString() } catch (e: Exception) { null }

    @Suppress("DEPRECATION")
    private fun Intent.streamUri(): Uri? =
        if (Build.VERSION.SDK_INT >= 33) getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java) else getParcelableExtra(Intent.EXTRA_STREAM) as? Uri

    @Suppress("DEPRECATION")
    private fun Intent.streamUris(): List<Uri> =
        (if (Build.VERSION.SDK_INT >= 33) getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
         else getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)) ?: emptyList()
}
