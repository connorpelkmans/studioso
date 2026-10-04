// UNTESTED: written without compiler access. Share target for ACTION_SEND (text/plain, image/*) and ACTION_SEND_MULTIPLE (image/*).
//   text  -> POST to the capture endpoint, Toast "Added to Studyboard" (failure: queued, toast says so).
//   image -> downscaled JPEG saved in the file queue, then MainActivity is opened; the web layer drains it on resume (StudyboardSharedQueue).
// Only the first image of a SEND_MULTIPLE is used (one photo per capture).
package com.studioso.app.capture

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val i = intent
        val type = i?.type ?: ""
        when {
            i?.action == Intent.ACTION_SEND && type.startsWith("text/") -> shareText(i)
            i?.action == Intent.ACTION_SEND && type.startsWith("image/") -> shareImage(i.getParcelableExtraCompat(Intent.EXTRA_STREAM), i.getStringExtra(Intent.EXTRA_TEXT))
            i?.action == Intent.ACTION_SEND_MULTIPLE && type.startsWith("image/") ->
                shareImage(i.getParcelableArrayListExtraCompat().firstOrNull(), i.getStringExtra(Intent.EXTRA_TEXT))
            else -> finish()
        }
    }

    private fun shareText(i: Intent) {
        val text = listOfNotNull(i.getStringExtra(Intent.EXTRA_SUBJECT), i.getStringExtra(Intent.EXTRA_TEXT)).joinToString(" ").trim()
        scope.launch {
            val msg = when (val r = CaptureClient.send(applicationContext, text, source = "android-share")) {
                is CaptureResult.Added -> "Added to Studyboard"
                CaptureResult.NotConfigured -> "Saved. Turn on Quick Capture in Studyboard Settings to send it."
                CaptureResult.Invalid -> "Nothing to add."
                is CaptureResult.Failed -> if (r.queued) "Saved. It will be added when you open Studyboard." else "Couldn't add it."
            }
            Toast.makeText(applicationContext, msg, Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    private fun shareImage(uri: Uri?, text: String?) {
        if (uri == null) { finish(); return }
        scope.launch {
            val jpeg = withContext(Dispatchers.IO) { downscale(uri) }
            val ok = jpeg != null && CaptureQueue.enqueue(
                applicationContext, UUID.randomUUID().toString(), (text?.trim()?.take(CaptureClient.MAX_TEXT)).takeUnless { it.isNullOrEmpty() } ?: "Photo from share sheet",
                null, null, "android-share", jpeg
            )
            if (ok) {
                startActivity(packageManager.getLaunchIntentForPackage(packageName)?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP))
            } else {
                Toast.makeText(applicationContext, "Couldn't read that image.", Toast.LENGTH_SHORT).show()
            }
            finish()
        }
    }

    /** JPEG <= 2048 px on the long side and <= 8 MB, or null. */
    private fun downscale(uri: Uri): ByteArray? = try {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 2048) sample *= 2
        val bmp = contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
        var out: ByteArray? = null
        if (bmp != null) for (q in intArrayOf(80, 60, 40)) {
            val bos = ByteArrayOutputStream()
            bmp.compress(Bitmap.CompressFormat.JPEG, q, bos)
            if (bos.size() <= 8 * 1024 * 1024) { out = bos.toByteArray(); break }
        }
        out   // EXIF rotation is not applied here: verify on a device with a rotated photo (use androidx.exifinterface if needed)
    } catch (e: Exception) { null }

    override fun onDestroy() { scope.cancel(); super.onDestroy() }

    @Suppress("DEPRECATION")
    private fun Intent.getParcelableExtraCompat(name: String): Uri? =
        if (android.os.Build.VERSION.SDK_INT >= 33) getParcelableExtra(name, Uri::class.java) else getParcelableExtra(name) as? Uri

    @Suppress("DEPRECATION")
    private fun Intent.getParcelableArrayListExtraCompat(): List<Uri> =
        (if (android.os.Build.VERSION.SDK_INT >= 33) getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
         else getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)) ?: emptyList()
}
