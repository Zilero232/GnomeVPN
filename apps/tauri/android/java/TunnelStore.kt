package ru.gnomevpn.app

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONArray
import org.json.JSONObject

data class TunnelSnapshot(
    val server: String,
    val dns: List<String>,
    val tunAddress: String,
    val configJson: String,
    val heartbeat: HeartbeatInfo? = null,
) {
    fun toJson(): String = configJson

    fun toStorageJson(): String = JSONObject().apply {
        put(FIELD_SERVER, server)
        put(FIELD_DNS, JSONArray(dns))
        put(FIELD_TUN_ADDRESS, tunAddress)
        put(FIELD_CONFIG_JSON, configJson)
        heartbeat?.let { put(FIELD_HEARTBEAT, it.toJson()) }
    }.toString()

    companion object {
        private const val FIELD_SERVER = "server"
        private const val FIELD_DNS = "dns"
        private const val FIELD_TUN_ADDRESS = "tunAddress"
        private const val FIELD_CONFIG_JSON = "configJson"
        private const val FIELD_HEARTBEAT = "heartbeat"
        private const val DEFAULT_TUN_ADDRESS = "10.8.0.2"

        fun fromJson(raw: String): TunnelSnapshot? = runCatching {
            val json = JSONObject(raw)
            val dns = json.optJSONArray(FIELD_DNS) ?: JSONArray()

            TunnelSnapshot(
                server = json.getString(FIELD_SERVER),
                dns = (0 until dns.length()).map(dns::getString),
                tunAddress = json.optString(FIELD_TUN_ADDRESS, DEFAULT_TUN_ADDRESS),
                configJson = json.optString(FIELD_CONFIG_JSON, ""),
                heartbeat = json.optJSONObject(FIELD_HEARTBEAT)?.let(HeartbeatInfo::fromJson),
            )
        }.getOrNull()
    }
}

data class HeartbeatInfo(
    val apiUrl: String,
    val token: String,
    val deviceId: String,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put(FIELD_API_URL, apiUrl)
        put(FIELD_TOKEN, token)
        put(FIELD_DEVICE_ID, deviceId)
    }

    companion object {
        private const val FIELD_API_URL = "apiUrl"
        private const val FIELD_TOKEN = "token"
        private const val FIELD_DEVICE_ID = "deviceId"

        fun fromJson(json: JSONObject): HeartbeatInfo? = runCatching {
            HeartbeatInfo(
                apiUrl = json.getString(FIELD_API_URL),
                token = json.getString(FIELD_TOKEN),
                deviceId = json.getString(FIELD_DEVICE_ID),
            )
        }.getOrNull()
    }
}

object TunnelStore {
    private const val TAG = "GnomeVpnStore"
    private const val PREFS = "gnomevpn.tunnel"
    private const val KEY_PAYLOAD = "payload"
    private const val KEY_AUTO_RECONNECT = "autoReconnect"
    private const val KEY_ALIAS = "gnomevpn.tunnel.key"
    private const val KEYSTORE = "AndroidKeyStore"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val TAG_BITS = 128
    private const val IV_BYTES = 12

    fun save(context: Context, snapshot: TunnelSnapshot) {
        val sealed = runCatching { seal(snapshot.toStorageJson()) }.getOrElse { error ->
            Log.w(TAG, "cannot seal the tunnel config", error)

            return
        }

        prefs(context).edit().putString(KEY_PAYLOAD, sealed).commit()
    }

    fun load(context: Context): TunnelSnapshot? {
        val sealed = prefs(context).getString(KEY_PAYLOAD, null) ?: return null

        val raw = runCatching { open(sealed) }.getOrElse { error ->
            Log.w(TAG, "cannot open the tunnel config", error)
            clear(context)

            return null
        }

        return TunnelSnapshot.fromJson(raw)
    }

    fun clear(context: Context) {
        prefs(context).edit().remove(KEY_PAYLOAD).commit()
    }

    fun setAutoReconnect(context: Context, isEnabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_AUTO_RECONNECT, isEnabled).commit()
    }

    fun autoReconnect(context: Context): Boolean =
        prefs(context).getBoolean(KEY_AUTO_RECONNECT, true)

    @Suppress("DEPRECATION")
    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE or Context.MODE_MULTI_PROCESS,
        )

    private fun seal(plain: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key())

        val encrypted = cipher.doFinal(plain.toByteArray())
        val payload = cipher.iv + encrypted

        return Base64.encodeToString(payload, Base64.NO_WRAP)
    }

    private fun open(sealed: String): String {
        val payload = Base64.decode(sealed, Base64.NO_WRAP)
        val iv = payload.copyOfRange(0, IV_BYTES)
        val ciphertext = payload.copyOfRange(IV_BYTES, payload.size)

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(TAG_BITS, iv))

        return String(cipher.doFinal(ciphertext))
    }

    private fun key(): SecretKey {
        val store = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        val existing = store.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry

        if (existing != null) {
            return existing.secretKey
        }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)

        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build(),
        )

        return generator.generateKey()
    }
}
