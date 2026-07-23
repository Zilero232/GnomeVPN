package app.gnomevpn.mobile

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
    val port: Int,
    val auth: String,
    val serverName: String,
    val insecure: Boolean,
    val dns: List<String>,
) {
    fun toJson(): String = JSONObject().apply {
        put(FIELD_SERVER, server)
        put(FIELD_PORT, port)
        put(FIELD_AUTH, auth)
        put(FIELD_SERVER_NAME, serverName)
        put(FIELD_INSECURE, insecure)
        put(FIELD_DNS, JSONArray(dns))
    }.toString()

    companion object {
        private const val FIELD_SERVER = "server"
        private const val FIELD_PORT = "port"
        private const val FIELD_AUTH = "auth"
        private const val FIELD_SERVER_NAME = "serverName"
        private const val FIELD_INSECURE = "insecure"
        private const val FIELD_DNS = "dns"

        fun fromJson(raw: String): TunnelSnapshot? = runCatching {
            val json = JSONObject(raw)
            val dns = json.optJSONArray(FIELD_DNS) ?: JSONArray()

            TunnelSnapshot(
                server = json.getString(FIELD_SERVER),
                port = json.getInt(FIELD_PORT),
                auth = json.getString(FIELD_AUTH),
                serverName = json.getString(FIELD_SERVER_NAME),
                insecure = json.optBoolean(FIELD_INSECURE, true),
                dns = (0 until dns.length()).map(dns::getString),
            )
        }.getOrNull()
    }
}

object TunnelStore {
    private const val TAG = "GnomeVpnStore"
    private const val PREFS = "gnomevpn.tunnel"
    private const val KEY_PAYLOAD = "payload"
    private const val KEY_ALIAS = "gnomevpn.tunnel.key"
    private const val KEYSTORE = "AndroidKeyStore"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val TAG_BITS = 128
    private const val IV_BYTES = 12

    fun save(context: Context, snapshot: TunnelSnapshot) {
        val sealed = runCatching { seal(snapshot.toJson()) }.getOrElse { error ->
            Log.w(TAG, "cannot seal the tunnel config", error)

            return
        }

        prefs(context).edit().putString(KEY_PAYLOAD, sealed).apply()
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
        prefs(context).edit().remove(KEY_PAYLOAD).apply()
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun seal(plain: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key())

        val encrypted = cipher.doFinal(plain.toByteArray())
        val payload = cipher.iv + encrypted

        return Base64.encodeToString(payload, Base64.NO_WRAP)
    }

    private fun open(sealed: String): String {
        val payload = Base64.decode(sealed, Base64.NO_WRAP)
        val cipher = Cipher.getInstance(TRANSFORMATION)

        cipher.init(
            Cipher.DECRYPT_MODE,
            key(),
            GCMParameterSpec(TAG_BITS, payload, 0, IV_BYTES),
        )

        return String(cipher.doFinal(payload, IV_BYTES, payload.size - IV_BYTES))
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
