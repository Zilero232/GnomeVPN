package ru.gnomevpn.app

import android.content.Context
import android.os.SystemClock

object TunnelTraffic {
    private const val PREFS = "gnomevpn.tunnel.traffic"
    private const val KEY_RX = "rx"
    private const val KEY_TX = "tx"
    private const val KEY_SINCE = "since"

    data class Counters(val rx: Long, val tx: Long, val since: Long)

    fun markStart(context: Context) {
        prefs(context).edit().putLong(KEY_SINCE, SystemClock.elapsedRealtime()).commit()
    }

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

        return Counters(prefs.getLong(KEY_RX, 0), prefs.getLong(KEY_TX, 0), prefs.getLong(KEY_SINCE, 0))
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
