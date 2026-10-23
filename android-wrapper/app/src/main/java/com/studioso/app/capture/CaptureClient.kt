// UNTESTED on a device
package com.studioso.app.capture

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

sealed class CaptureResult {
    data class Added(val speech: String) : CaptureResult()
    /* No token on this device (or the server refused it) */
    data class NotConfigured(val queued: Boolean) : CaptureResult()
    object Invalid : CaptureResult()
    /* The server refused the item permanently (4xx) */
    object Rejected : CaptureResult()
    /* Transient failure */
    data class Failed(val queued: Boolean) : CaptureResult()
}

/* One capture waiting for delivery */
data class OutboxItem(
    val id: String,
    val text: String,
    val due: String?,
    val course: String?,
    val source: String,
    val createdAt: Long,
    val attempts: Int,
    val nextAt: Long
) {
    fun toJson(): JSONObject = JSONObject().put("id", id).put("text", text).put("source", source)
        .put("createdAt", createdAt).put("attempts", attempts).put("nextAt", nextAt).apply {
            due?.let { put("due", it) }
            course?.let { put("course", it) }
        }

    companion object {
        fun fromJson(j: JSONObject): OutboxItem? {
            val id = j.optString("id", "")
            val text = j.optString("text", "")
            if (!CaptureQueue.ID_RE.matches(id) || text.isBlank()) return null
            return OutboxItem(
                id, text,
                j.optString("due", "").ifBlank { null },
                j.optString("course", "").ifBlank { null },
                j.optString("source", "app").ifBlank { "app" },
                j.optLong("createdAt", System.currentTimeMillis()),
                j.optInt("attempts", 0),
                j.optLong("nextAt", 0L)
            )
        }
    }
}

private sealed class Attempt {
    data class Ok(val speech: String) : Attempt()
    object Permanent : Attempt()
    object Unauthorized : Attempt()
    object Transient : Attempt()
}

object CaptureClient {
    const val TIMEOUT_MS = 8000
    const val MAX_TEXT = 500
    const val MAX_DUE = 64
    const val MAX_COURSE = 80
    const val MAX_ATTEMPTS = 6
    const val MAX_AGE_MS = 7L * 24 * 60 * 60 * 1000
    private val BACKOFF_MS = longArrayOf(30_000L, 60_000L, 2 * 60_000L, 5 * 60_000L, 15 * 60_000L, 60 * 60_000L)
    private val SOURCES = setOf("siri", "shortcut", "share", "android-share", "gemini", "tile", "bixby", "http", "app")
    private val flushLock = Mutex()
    private val background = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private fun clip(s: String?, n: Int): String? = s?.trim()?.takeIf { it.isNotEmpty() }?.take(n)

    private fun backoff(attempts: Int): Long = BACKOFF_MS[(attempts - 1).coerceIn(0, BACKOFF_MS.size - 1)]

    /* POST one capture (the caller has already asked the person to confirm) */
    suspend fun send(context: Context, text: String, due: String? = null, course: String? = null, source: String = "app"): CaptureResult =
        withContext(Dispatchers.IO) {
            val t = clip(text, MAX_TEXT) ?: return@withContext CaptureResult.Invalid
            val now = System.currentTimeMillis()
            val item = OutboxItem(UUID.randomUUID().toString(), t, clip(due, MAX_DUE), clip(course, MAX_COURSE),
                if (source in SOURCES) source else "app", now, 0, now + backoff(1))
            val creds = CaptureStore.load(context)
                ?: return@withContext CaptureResult.NotConfigured(handOff(context, item))
            val persisted = CaptureOutbox.write(context, item)
            deliver(context, item, creds, persisted)
        }

    /* Retries due outbox items once each, oldest first */
    suspend fun flushOutbox(context: Context): Int = withContext(Dispatchers.IO) {
        if (!flushLock.tryLock()) return@withContext 0
        var delivered = 0
        try {
            val creds = CaptureStore.load(context) ?: return@withContext 0
            val now = System.currentTimeMillis()
            for (item in CaptureOutbox.items(context)) {
                if (now - item.createdAt > MAX_AGE_MS) { handOff(context, item); CaptureOutbox.remove(context, item.id); continue }
                if (item.nextAt > now) continue
                val claimed = item.copy(nextAt = now + backoff(item.attempts + 1))
                CaptureOutbox.write(context, claimed)
                when (deliver(context, claimed, creds, true)) {
                    is CaptureResult.Added -> delivered++
                    is CaptureResult.Failed -> break
                    else -> Unit
                }
            }
        } finally {
            flushLock.unlock()
        }
        delivered
    }

    /* Fire-and-forget flush, for callers that are not coroutines */
    fun flushInBackground(context: Context) {
        val app = context.applicationContext
        background.launch { try { flushOutbox(app) } catch (e: Exception) { } }
    }

    private fun deliver(context: Context, item: OutboxItem, creds: Pair<String, String>, persisted: Boolean): CaptureResult =
        when (val a = post(item, creds.first, creds.second)) {
            is Attempt.Ok -> { CaptureOutbox.remove(context, item.id); CaptureResult.Added(a.speech) }
            Attempt.Permanent -> { CaptureOutbox.remove(context, item.id); CaptureResult.Rejected }
            Attempt.Unauthorized -> {
                val queued = handOff(context, item)
                CaptureOutbox.remove(context, item.id)
                CaptureResult.NotConfigured(queued)
            }
            Attempt.Transient -> {
                val n = item.attempts + 1
                if (n >= MAX_ATTEMPTS || !persisted) {
                    val queued = handOff(context, item)
                    CaptureOutbox.remove(context, item.id)
                    CaptureResult.Failed(queued)
                } else {
                    val ok = CaptureOutbox.write(context, item.copy(attempts = n, nextAt = System.currentTimeMillis() + backoff(n)))
                    CaptureResult.Failed(ok)
                }
            }
        }

    /* Moves an item to the app's queue */
    private fun handOff(context: Context, item: OutboxItem): Boolean =
        CaptureQueue.enqueue(context, item.id, item.text, item.due, item.course, item.source, null)

    private fun post(item: OutboxItem, token: String, endpoint: String): Attempt {
        val body = JSONObject().put("text", item.text).apply {
            item.due?.let { put("due", it) }
            item.course?.let { put("course", it) }
            put("source", item.source)
        }.toString()
        var conn: HttpURLConnection? = null
        return try {
            val u = URL(endpoint)
            if (u.protocol != "https" || !CaptureStore.validEndpoint(endpoint)) return Attempt.Permanent
            val c = (u.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                instanceFollowRedirects = false
                useCaches = false
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Idempotency-Key", item.id)
            }
            conn = c
            c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = c.responseCode
            when {
                code in 200..299 -> {
                    val raw = c.inputStream.bufferedReader().use { it.readText() }.take(8192)
                    val json = try { JSONObject(raw) } catch (e: Exception) { null }
                    if (json == null || !json.optBoolean("ok", false)) Attempt.Transient
                    else {
                        val speech = json.optString("speech", "").trim()
                        Attempt.Ok(if (speech.isNotEmpty() && speech.length <= 200) speech else "Added to Studyboard: ${item.text}")
                    }
                }
                code == 401 || code == 403 -> Attempt.Unauthorized
                code == 408 || code == 429 -> Attempt.Transient
                code in 400..499 -> Attempt.Permanent
                else -> Attempt.Transient
            }
        } catch (e: Exception) {
            Attempt.Transient
        } finally {
            conn?.disconnect()
        }
    }
}

/* Retry store for captures the native side still owes the server */
object CaptureOutbox {
    private fun dir(context: Context) = File(context.filesDir, "capture-outbox").apply { mkdirs() }

    fun write(context: Context, item: OutboxItem): Boolean = CaptureQueue.atomicWrite(File(dir(context), "${item.id}.json"), item.toJson().toString().toByteArray(Charsets.UTF_8))

    fun items(context: Context): List<OutboxItem> =
        (dir(context).listFiles { f -> f.extension == "json" } ?: emptyArray()).mapNotNull {
            try { OutboxItem.fromJson(JSONObject(it.readText())) } catch (e: Exception) { it.delete(); null }
        }.sortedBy { it.createdAt }

    fun remove(context: Context, id: String) {
        if (CaptureQueue.ID_RE.matches(id)) File(dir(context), "$id.json").delete()
    }

    fun clear(context: Context) {
        dir(context).listFiles()?.forEach { it.delete() }
    }
}

/* The app's queue */
object CaptureQueue {
    val ID_RE = Regex("^[A-Za-z0-9-]{1,64}$")
    const val MAX_AGE_MS = 30L * 24 * 60 * 60 * 1000
    private fun dir(context: Context) = File(context.filesDir, "pending-captures").apply { mkdirs() }

    /* Write to <name>.tmp then rename over the target (rename is atomic on the same filesystem) */
    fun atomicWrite(target: File, bytes: ByteArray): Boolean = try {
        val tmp = File(target.parentFile, target.name + ".tmp")
        tmp.writeBytes(bytes)
        if (tmp.renameTo(target)) true else { tmp.delete(); false }
    } catch (e: Exception) { false }

    fun enqueue(context: Context, id: String, text: String?, due: String?, course: String?, source: String?, imageJpeg: ByteArray?, kind: String = "task", url: String? = null): Boolean = try {
        if (!ID_RE.matches(id)) false else {
            val d = dir(context)
            val imageOk = imageJpeg == null || atomicWrite(File(d, "$id.jpg"), imageJpeg)
            val j = JSONObject().put("id", id).put("kind", kind).put("createdAt", System.currentTimeMillis())
            text?.let { j.put("text", it) }; due?.let { j.put("due", it) }; course?.let { j.put("course", it) }; source?.let { j.put("source", it) }; url?.let { j.put("url", it) }
            if (imageJpeg != null) j.put("hasImage", true)
            imageOk && atomicWrite(File(d, "$id.json"), j.toString().toByteArray(Charsets.UTF_8))
        }
    } catch (e: Exception) { false }

    fun items(context: Context): List<JSONObject> {
        val now = System.currentTimeMillis()
        return (dir(context).listFiles { f -> f.extension == "json" } ?: emptyArray()).mapNotNull {
            val j = try { JSONObject(it.readText()) } catch (e: Exception) { null }
            val id = j?.optString("id", "") ?: ""
            if (j == null || !ID_RE.matches(id)) { it.delete(); null }
            else if (now - j.optLong("createdAt", now) > MAX_AGE_MS) { remove(context, id); null }
            else j
        }.sortedBy { it.optLong("createdAt") }
    }

    fun image(context: Context, id: String): ByteArray? =
        if (ID_RE.matches(id)) File(dir(context), "$id.jpg").takeIf { it.exists() }?.readBytes() else null

    fun remove(context: Context, id: String) {
        if (!ID_RE.matches(id)) return
        File(dir(context), "$id.json").delete(); File(dir(context), "$id.jpg").delete()
    }
}
