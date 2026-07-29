package ru.gnomevpn.app

import android.content.Context

object TunnelTraffic {
    private const val PREFS = "gnomevpn.tunnel.traffic"
    private const val KEY_RX = "rx"
    private const val KEY_TX = "tx"

    data class Counters(val rx: Long, val tx: Long)

    fun publish(context: Context) {
        val rx = runCatching { TunnelEngine.nativeTrafficRx() }.getOrDefault(0)
        val tx = runCatching { TunnelEngine.nativeTrafficTx() }.getOrDefault(0)

        prefs(context)
            .edit()
            .putLong(KEY_RX, rx)
            .putLong(KEY_TX, tx)
            .commit()
    }

    fun read(context: Context): Counters {
        val prefs = prefs(context)

        return Counters(prefs.getLong(KEY_RX, 0), prefs.getLong(KEY_TX, 0))
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().commit()
    }

    @Suppress("DEPRECATION")
    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE or Context.MODE_MULTI_PROCESS,
        )
}
