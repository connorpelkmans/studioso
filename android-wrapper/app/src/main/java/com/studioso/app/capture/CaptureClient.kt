// UNTESTED: written without compiler access. Contract: capture-contract.json at the repo root (tests/capture-contract.test.js greps this file
// for the constants below: path, Idempotency-Key, Bearer, 8000 ms timeout).
// HTTPS only (also enforced by res/xml/network_security_config.xml), 8 s timeout, Idempotency-Key header, no logging of the token or the task text.
package com.studioso.app.capture

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

sealed class CaptureResult {
    data class Added(val speech: String) : CaptureResult()
    object NotConfigured : CaptureResult()
    object Invalid : CaptureResult()
    data class Failed(val queued: Boolean) : CaptureResult()
}

object CaptureClient {
    const val TIMEOUT_MS = 8000
    const val MAX_TEXT = 500
    const val MAX_DUE = 64
    const val MAX_COURSE = 80
    private val SOURCES = setOf("siri", "shortcut", "share", "android-share", "gemini", "tile", "bixby", "http", "app")

    private fun clip(s: String?, n: Int): String? = s?.trim()?.takeIf { it.isNotEmpty() }?.take(n)

    /** POST one capture. On a network/server failure the item is queued in filesDir/pending-captures and drained by the app on resume. */
    suspend fun send(context: Context, text: String, due: String? = null, course: String? = null, source: String = "app"): CaptureResult =
        withContext(Dispatchers.IO) {
            val t = clip(text, MAX_TEXT) ?: return@withContext CaptureResult.Invalid
            val id = UUID.randomUUID().toString()
            val src = if (source in SOURCES) source else "app"
            val creds = CaptureStore.load(context)
            if (creds == null) {
                CaptureQueue.enqueue(context, id, t, clip(due, MAX_DUE), clip(course, MAX_COURSE), src, null)
                return@withContext CaptureResult.NotConfigured
            }
            val (token, endpoint) = creds
            val body = JSONObject().put("text", t).apply {
                clip(due, MAX_DUE)?.let { put("due", it) }
                clip(course, MAX_COURSE)?.let { put("course", it) }
                put("source", src)
            }.toString()
            var conn: HttpURLConnection? = null
            try {
                conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = TIMEOUT_MS
                    readTimeout = TIMEOUT_MS
                    instanceFollowRedirects = false
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer $token")
                    setRequestProperty("Idempotency-Key", id)
                }
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                if (conn.responseCode !in 200..299) throw java.io.IOException("http")
                val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
                if (!json.optBoolean("ok", false)) throw java.io.IOException("not ok")
                val speech = json.optString("speech", "").trim()
                CaptureResult.Added(if (speech.isNotEmpty() && speech.length <= 200) speech else "Added to Studyboard: $t")
            } catch (e: Exception) {                       // never log `e` with the request: keep the token and text out of logcat
                val queued = CaptureQueue.enqueue(context, id, t, clip(due, MAX_DUE), clip(course, MAX_COURSE), src, null)
                CaptureResult.Failed(queued)
            } finally {
                conn?.disconnect()
            }
        }
}

/** Files in filesDir/pending-captures: <id>.json (+ <id>.jpg). Same item shape as "sharedQueueItem" in capture-contract.json. */
object CaptureQueue {
    private fun dir(context: Context) = File(context.filesDir, "pending-captures").apply { mkdirs() }

    fun enqueue(context: Context, id: String, text: String?, due: String?, course: String?, source: String?, imageJpeg: ByteArray?, kind: String = "task", url: String? = null): Boolean = try {
        val d = dir(context)
        if (imageJpeg != null) File(d, "$id.jpg").writeBytes(imageJpeg)
        val j = JSONObject().put("id", id).put("kind", kind).put("createdAt", System.currentTimeMillis())
        text?.let { j.put("text", it) }; due?.let { j.put("due", it) }; course?.let { j.put("course", it) }; source?.let { j.put("source", it) }; url?.let { j.put("url", it) }
        if (imageJpeg != null) j.put("hasImage", true)
        File(d, "$id.json").writeText(j.toString())
        true
    } catch (e: Exception) { false }

    fun items(context: Context): List<JSONObject> =
        (dir(context).listFiles { f -> f.extension == "json" } ?: emptyArray()).mapNotNull {
            try { JSONObject(it.readText()) } catch (e: Exception) { null }
        }.sortedBy { it.optLong("createdAt") }

    fun image(context: Context, id: String): ByteArray? =
        if (Regex("^[A-Za-z0-9-]{1,64}$").matches(id)) File(dir(context), "$id.jpg").takeIf { it.exists() }?.readBytes() else null

    fun remove(context: Context, id: String) {
        if (!Regex("^[A-Za-z0-9-]{1,64}$").matches(id)) return
        File(dir(context), "$id.json").delete(); File(dir(context), "$id.jpg").delete()
    }
}
