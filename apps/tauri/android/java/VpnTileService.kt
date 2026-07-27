package ru.gnomevpn.app

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

class VpnTileService : TileService() {
    override fun onStartListening() {
        super.onStartListening()
        render()
    }

    override fun onClick() {
        super.onClick()

        if (GnomeVpnService.isRunning(this)) {
            stopTunnel()

            return
        }

        startTunnel()
    }

    private fun stopTunnel() {
        startService(
            Intent(this, GnomeVpnService::class.java)
                .setAction(GnomeVpnService.ACTION_STOP),
        )

        render(isActive = false)
    }

    private fun startTunnel() {
        if (TunnelStore.load(this) == null || VpnService.prepare(this) != null) {
            openApp()

            return
        }

        startForegroundService(
            Intent(this, GnomeVpnService::class.java)
                .setAction(GnomeVpnService.ACTION_START_FROM_TILE),
        )

        render(isActive = true)
    }

    private fun openApp() {
        val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return

        launch
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra(EXTRA_AUTO_CONNECT, true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val pending = PendingIntent.getActivity(
                this,
                0,
                launch,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            startActivityAndCollapse(pending)

            return
        }

        @Suppress("DEPRECATION")
        startActivityAndCollapse(launch)
    }

    private fun render(isActive: Boolean = GnomeVpnService.isRunning(this)) {
        val tile = qsTile ?: return

        tile.state = if (isActive) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.updateTile()
    }

    companion object {
        const val EXTRA_AUTO_CONNECT = "ru.gnomevpn.app.AUTO_CONNECT"

        fun requestUpdate(context: Context) {
            requestListeningState(context, ComponentName(context, VpnTileService::class.java))
        }
    }
}
