// UNTESTED: written without compiler access (no kotlinc / Android Studio / device here). Build and run it before relying on it.
// Platform APIs only (AndroidKeyStore AES-GCM, SharedPreferences, HttpURLConnection, org.json): no dependency on the androidx.security-crypto
// library (its status/versions change; verify before swapping it in).
//
// Token + endpoint are encrypted with a non-exportable AES key in the Android Keystore. Never logged.
package com.studioso.app.capture

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object CaptureStore {
    private const val PREFS = "sb_capture"                  // excluded from backup: res/xml/backup_rules.xml + data_extraction_rules.xml
    private const val KEY_ALIAS = "studyboard_capture_key"
    private val TOKEN_RE = Regex("^[A-Za-z0-9._~+/-]{16,512}$")
    private val HOST_RE = Regex("^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.supabase\\.co$")

    fun validEndpoint(endpoint: String): Boolean = try {
        val u = java.net.URI(endpoint)
        u.scheme == "https" && u.userInfo == null && u.port == -1 && u.host != null && HOST_RE.matches(u.host.lowercase()) &&
            u.path == "/functions/v1/capture-task"
    } catch (e: Exception) { false }

    private fun key(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        gen.init(
            KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return gen.generateKey()
    }

    private fun encrypt(plain: String): String {
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.ENCRYPT_MODE, key())
        val ct = c.doFinal(plain.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(c.iv + ct, Base64.NO_WRAP)
    }

    private fun decrypt(blob: String): String? = try {
        val all = Base64.decode(blob, Base64.NO_WRAP)
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, all, 0, 12))
        String(c.doFinal(all, 12, all.size - 12), Charsets.UTF_8)
    } catch (e: Exception) { null }   // key lost (restore, lock-screen reset): treat as "not configured"

    fun save(context: Context, token: String, endpoint: String): Boolean {
        if (!TOKEN_RE.matches(token) || !validEndpoint(endpoint)) return false
        return try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("token", encrypt(token)).putString("endpoint", encrypt(endpoint)).commit()
        } catch (e: Exception) { false }
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().commit()
    }

    /** Returns (token, endpoint) or null when not set up. */
    fun load(context: Context): Pair<String, String>? {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val t = p.getString("token", null)?.let { decrypt(it) } ?: return null
        val e = p.getString("endpoint", null)?.let { decrypt(it) } ?: return null
        return if (validEndpoint(e)) t to e else null
    }
}
