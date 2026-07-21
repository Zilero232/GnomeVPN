package app.gnomevpn.mobile

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.N)
class VpnTileService : TileService() {
    override fun onStartListening() {
        super.onStartListening()
        render()
    }

    override fun onClick() {
        super.onClick()

        if (GnomeVpnService.isRunning()) {
            stopService(Intent(this, GnomeVpnService::class.java))
            render()

            return
        }

        openApp()
    }

    private fun openApp() {
        val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return

        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            val pending =
                PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE)

            startActivityAndCollapse(pending)

            return
        }

        @Suppress("DEPRECATION")
        startActivityAndCollapse(launch)
    }

    private fun render() {
        val tile = qsTile ?: return

        tile.state = if (GnomeVpnService.isRunning()) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.updateTile()
    }

    companion object {
        fun requestUpdate(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
                return
            }

            requestListeningState(context, ComponentName(context, VpnTileService::class.java))
        }
    }
}
