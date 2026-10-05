// UNTESTED on a device. Syntax/type-checked with kotlinc against android-all (API 34) stubs only. Contract: capture-contract.json at the repo root
// (tests/capture-contract.test.js greps this file for the constants below: path, Idempotency-Key, Bearer, 8000 ms timeout).
// HTTPS only (also enforced by res/xml/network_security_config.xml), 8 s timeout, Idempotency-Key header, no logging of the token or the task text.
//
// Delivery rules (one capture = one stable id, used as the Idempotency-Key on EVERY attempt):
//   2xx + {"ok":true}            -> delivered: removed from the outbox.
//   4xx except 401/403/408/429   -> permanent (bad input, too large): dropped, never retried.
//   401/403                      -> the token is unknown/revoked: the item is handed to the app's queue (pending-captures), where the web
//                                   app shows it in its confirm sheet. Never retried against the server.
//   408/429/5xx/network/bad JSON -> transient: kept in filesDir/capture-outbox with attempts + nextAt (backoff 30 s .. 1 h), retried by
//                                   flushOutbox() (app start/resume via StudyboardSharedQueue.drain, and after each share). After MAX_ATTEMPTS
//                                   or MAX_AGE_MS the item is handed to the app's queue instead (the person confirms it there), so nothing loops forever.
// Server-side dedupe (supabase-functions/capture-task) honours the Idempotency-Key for 10 minutes only; a retry that lands later than that after
// an attempt whose response was lost can still add a duplicate. The outbox keeps the same key so a longer server window fixes that without app changes.
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
    /** No token on this device (or the server refused it): the item is in the app's queue for the confirm sheet. */
    data class NotConfigured(val queued: Boolean) : CaptureResult()
    object Invalid : CaptureResult()
    /** The server refused the item permanently (4xx): dropped. */
    object Rejected : CaptureResult()
    /** Transient failure: the item is kept in the outbox (queued = true) and retried later. */
    data class Failed(val queued: Boolean) : CaptureResult()
}

/** One capture waiting for delivery. `id` doubles as the Idempotency-Key. */
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

    /** POST one capture (the caller has already asked the person to confirm). See the delivery rules at the top of this file. */
    suspend fun send(context: Context, text: String, due: String? = null, course: String? = null, source: String = "app"): CaptureResult =
        withContext(Dispatchers.IO) {
            val t = clip(text, MAX_TEXT) ?: return@withContext CaptureResult.Invalid
            val now = System.currentTimeMillis()
            val item = OutboxItem(UUID.randomUUID().toString(), t, clip(due, MAX_DUE), clip(course, MAX_COURSE),
                if (source in SOURCES) source else "app", now, 0, now + backoff(1))
            val creds = CaptureStore.load(context)
                ?: return@withContext CaptureResult.NotConfigured(handOff(context, item))
            // Persist BEFORE the network call (nextAt in the future so a concurrent flush skips it): a killed process cannot lose the item.
            val persisted = CaptureOutbox.write(context, item)
            deliver(context, item, creds, persisted)
        }

    /** Retries due outbox items once each, oldest first. Stops at the first transient failure (probably offline). Safe to call often. */
    suspend fun flushOutbox(context: Context): Int = withContext(Dispatchers.IO) {
        if (!flushLock.tryLock()) return@withContext 0
        var delivered = 0
        try {
            val creds = CaptureStore.load(context) ?: return@withContext 0     // signed out: StudyboardCaptureToken.clear() wipes the outbox
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

    /** Fire-and-forget flush, for callers that are not coroutines (Capacitor plugin methods, activities finishing). */
    fun flushInBackground(context: Context) {
        val app = context.applicationContext
        background.launch { try { flushOutbox(app) } catch (e: Exception) { /* never log: may carry request data */ } }
    }

    private fun deliver(context: Context, item: OutboxItem, creds: Pair<String, String>, persisted: Boolean): CaptureResult =
        when (val a = post(item, creds.first, creds.second)) {
            is Attempt.Ok -> { CaptureOutbox.remove(context, item.id); CaptureResult.Added(a.speech) }
            Attempt.Permanent -> { CaptureOutbox.remove(context, item.id); CaptureResult.Rejected }
            Attempt.Unauthorized -> {
                val queued = handOff(context, item)          // write the new copy first, then delete the old one
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

    /** Moves an item to the app's queue (drained into the web app's confirm sheet by StudyboardSharedQueue). Same id: the page dedupes on it. */
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
            if (u.protocol != "https" || !CaptureStore.validEndpoint(endpoint)) return Attempt.Permanent   // scheme == "https" enforced
            val c = (u.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                instanceFollowRedirects = false
                useCaches = false
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Idempotency-Key", item.id)        // stable across retries: the server adds the item once
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
                else -> Attempt.Transient                              // 5xx, 3xx (redirects are not followed)
            }
        } catch (e: Exception) {                                       // never log `e`: keep the token and text out of logcat
            Attempt.Transient
        } finally {
            conn?.disconnect()
        }
    }
}

/** Retry store for captures the native side still owes the server: filesDir/capture-outbox/<id>.json, written atomically (tmp + rename). */
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

/** The app's queue: filesDir/pending-captures/<id>.json (+ <id>.jpg), drained into the web app by StudyboardSharedQueue.
 *  Same item shape as "sharedQueueItem" in capture-contract.json. The web app dedupes on `id`, so a re-delivered item is harmless. */
object CaptureQueue {
    val ID_RE = Regex("^[A-Za-z0-9-]{1,64}$")
    const val MAX_AGE_MS = 30L * 24 * 60 * 60 * 1000          // items the web app never accepted are dropped after 30 days
    private fun dir(context: Context) = File(context.filesDir, "pending-captures").apply { mkdirs() }

    /** Write to <name>.tmp then rename over the target (rename is atomic on the same filesystem). */
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
            imageOk && atomicWrite(File(d, "$id.json"), j.toString().toByteArray(Charsets.UTF_8))   // the .json appears last, after the image
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
