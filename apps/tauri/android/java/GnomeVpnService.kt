package ru.gnomevpn.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.net.Inet4Address
import java.net.InetAddress
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

        if (intent?.action == ACTION_START_FROM_TILE) {
            return startFromStoredSession()
        }

        val dns = intent?.getStringArrayExtra(EXTRA_DNS)?.takeIf { it.isNotEmpty() } ?: DEFAULT_DNS
        val server = intent?.getStringExtra(EXTRA_SERVER).orEmpty()

        return try {
            startTunnel(dns, server)
            START_STICKY
        } catch (error: Throwable) {
            Log.e(TAG, "failed to start the tunnel", error)
            teardown()
            stopSelf()

            START_NOT_STICKY
        }
    }

    private fun startFromStoredSession(): Int {
        val snapshot = TunnelStore.load(this)

        if (snapshot == null) {
            Log.w(TAG, "tile start requested without a stored session")
            stopSelf()

            return START_NOT_STICKY
        }

        return try {
            val fd = openDescriptor(snapshot.dns.toTypedArray(), snapshot.server)

            TunnelEngine.nativeStart(
                applicationInfo.nativeLibraryDir,
                filesDir.absolutePath,
                snapshot.toJson(),
                fd,
            )

            publish(fd)
            Log.i(TAG, "tile tunnel is up, fd=$fd")
            START_STICKY
        } catch (error: Throwable) {
            Log.e(TAG, "failed to start the tunnel from the tile", error)
            teardown()
            stopSelf()

            START_NOT_STICKY
        }
    }

    private fun openDescriptor(dns: Array<String>, server: String): Int {
        val builder = Builder()
            .setSession(SESSION)
            .setMtu(MTU)
            .addAddress(TUN_ADDRESS, TUN_PREFIX)

        for (route in routesExcluding(server)) {
            builder.addRoute(route.first, route.second)
        }

        for (entry in dns) {
            builder.addDnsServer(entry)
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
        VpnTileService.requestUpdate(this)

        return opened.fd
    }

    private fun startTunnel(dns: Array<String>, server: String) {
        val fd = openDescriptor(dns, server)
        publish(fd)

        Log.i(TAG, "tunnel is up, fd=$fd")
    }

    // The half routes cover everything, the node included, so a packet destined
    // for the node would be sent through the tunnel that node serves. Splitting
    // the space around its address keeps xray reaching it over the real link.
    private fun routesExcluding(server: String): List<Pair<String, Int>> {
        val address = runCatching { InetAddress.getByName(server) }.getOrNull()

        if (address !is Inet4Address) {
            return listOf(ROUTE_LOWER_HALF to 1, ROUTE_UPPER_HALF to 1)
        }

        val target = address.address.fold(0L) { acc, byte -> (acc shl 8) or (byte.toLong() and 0xFF) }
        val routes = mutableListOf<Pair<String, Int>>()

        for (prefix in 32 downTo 1) {
            val bit = 1L shl (32 - prefix)
            val network = (target xor bit) and (-bit and 0xFFFFFFFFL)

            routes.add(intToIp(network) to prefix)
        }

        return routes
    }

    private fun intToIp(value: Long): String =
        "${(value shr 24) and 0xFF}.${(value shr 16) and 0xFF}.${(value shr 8) and 0xFF}.${value and 0xFF}"

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationManager().createNotificationChannel(
                NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW),
            )
        }

        val launch = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        val open = PendingIntent.getActivity(
            this,
            0,
            launch,
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
        runCatching { TunnelEngine.nativeStop() }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_DETACH)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(false)
        }

        descriptor?.close()
        descriptor = null
        publish(NO_DESCRIPTOR)
        VpnTileService.requestUpdate(this)

        notificationManager().cancel(NOTIFICATION_ID)
    }

    private fun notificationManager(): NotificationManager =
        getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

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
        const val ACTION_STOP = "ru.gnomevpn.app.STOP"
        const val ACTION_START_FROM_TILE = "ru.gnomevpn.app.START_FROM_TILE"
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

        fun isRunning(): Boolean = currentFd != NO_DESCRIPTOR

        fun isRunning(context: Context): Boolean {
            if (currentFd != NO_DESCRIPTOR) {
                return true
            }

            return runCatching {
                val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE)
                    as? ConnectivityManager ?: return false

                val capabilities = manager.activeNetwork?.let(manager::getNetworkCapabilities)

                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
            }.getOrDefault(false)
        }
    }
}
