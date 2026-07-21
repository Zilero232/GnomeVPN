package app.gnomevpn.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class GnomeVpnService : VpnService() {
    private var descriptor: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            teardown()
            stopSelf()

            return START_NOT_STICKY
        }

        val dns = intent?.getStringArrayExtra(EXTRA_DNS)?.takeIf { it.isNotEmpty() } ?: DEFAULT_DNS

        return try {
            startTunnel(dns)
            START_STICKY
        } catch (error: Throwable) {
            Log.e(TAG, "failed to start the tunnel", error)
            teardown()
            stopSelf()

            START_NOT_STICKY
        }
    }

    private fun startTunnel(dns: Array<String>) {
        val builder = Builder()
            .setSession(SESSION)
            .setMtu(MTU)
            .addAddress(TUN_ADDRESS, TUN_PREFIX)
            .addRoute(ROUTE_LOWER_HALF, 1)
            .addRoute(ROUTE_UPPER_HALF, 1)

        for (server in dns) {
            builder.addDnsServer(server)
        }

        try {
            builder.addDisallowedApplication(packageName)
        } catch (error: Throwable) {
            Log.w(TAG, "cannot exclude ourselves from the tunnel", error)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setMetered(false)
        }

        val opened = builder.establish()
            ?: throw IllegalStateException("VpnService.establish() returned null")

        descriptor = opened
        startForeground(NOTIFICATION_ID, buildNotification())
        publish(opened.fd)

        Log.i(TAG, "tunnel is up, fd=${opened.fd}")
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW),
            )
        }

        val open = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle(SESSION)
            .setContentText(NOTIFICATION_TEXT)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(open)
            .setOngoing(true)
            .build()
    }

    private fun teardown() {
        descriptor?.close()
        descriptor = null
        publish(NO_DESCRIPTOR)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
    }

    override fun onRevoke() {
        Log.w(TAG, "vpn permission revoked by the system")
        teardown()
        stopSelf()
    }

    override fun onDestroy() {
        teardown()
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "app.gnomevpn.mobile.STOP"
        const val EXTRA_SERVER = "server"
        const val EXTRA_DNS = "dns"
        const val NO_DESCRIPTOR = -1

        private const val TAG = "GnomeVpn"
        private const val SESSION = "GnomeVPN"
        private const val CHANNEL_ID = "gnomevpn.tunnel"
        private const val CHANNEL_NAME = "Tunnel"
        private const val NOTIFICATION_TEXT = "Tunnel is active"
        private const val NOTIFICATION_ID = 1
        private const val START_TIMEOUT_SECONDS = 15L

        private const val TUN_ADDRESS = "10.8.0.2"
        private const val TUN_PREFIX = 24
        private const val MTU = 1420

        // Half routes rather than 0.0.0.0/0: replacing the physical default
        // route strands the device if the tunnel dies before it is torn down.
        private const val ROUTE_LOWER_HALF = "0.0.0.0"
        private const val ROUTE_UPPER_HALF = "128.0.0.0"

        private val DEFAULT_DNS = arrayOf("1.1.1.1", "8.8.8.8")

        @Volatile
        private var currentFd = NO_DESCRIPTOR

        private var latch: CountDownLatch? = null

        @JvmStatic
        fun awaitDescriptor(): Int {
            val waiter = CountDownLatch(1)

            synchronized(this) {
                if (currentFd != NO_DESCRIPTOR) {
                    return currentFd
                }

                latch = waiter
            }

            val published = waiter.await(START_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            synchronized(this) { latch = null }

            return if (published) currentFd else NO_DESCRIPTOR
        }

        @JvmStatic
        fun publish(fd: Int) {
            synchronized(this) {
                currentFd = fd

                if (fd != NO_DESCRIPTOR) {
                    latch?.countDown()
                }
            }
        }
    }
}
