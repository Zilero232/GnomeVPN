package ru.gnomevpn.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action !in BOOT_ACTIONS) {
            return
        }

        if (TunnelStore.load(context) == null) {
            return
        }

        runCatching { GnomeVpnService.start(context) }
            .onFailure { error -> Log.w(TAG, "cannot restart the tunnel after boot", error) }
    }

    private companion object {
        const val TAG = "GnomeVpnBoot"

        val BOOT_ACTIONS = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
        )
    }
}
