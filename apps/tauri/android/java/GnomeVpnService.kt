package ru.gnomevpn.app

import android.app.ActivityManager
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log
import java.net.Inet4Address
import java.net.InetAddress

class GnomeVpnService : VpnService() {
    private var descriptor: ParcelFileDescriptor? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var activeNetwork: Network? = null
    private var isStopping = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            isStopping = true
            cancelRevival()
            teardown()
            stopSelf()

            return START_NOT_STICKY
        }

        return startFromStoredSession()
    }

    private fun startFromStoredSession(): Int {
        val snapshot = TunnelStore.load(this)

        if (snapshot == null) {
            Log.w(TAG, "start requested without a stored session")
            stopSelf()

            return START_NOT_STICKY
        }

        return try {
            val dns = snapshot.dns.takeIf { it.isNotEmpty() }?.toTypedArray() ?: DEFAULT_DNS
            val fd = openDescriptor(dns, snapshot.server, snapshot.tunAddress)

            startEngine(snapshot.toJson(), fd, TunnelStore.autoReconnect(this))

            publish(this, true)
            Log.i(TAG, "tunnel is up, fd=$fd")
            START_STICKY
        } catch (error: Throwable) {
            Log.e(TAG, "failed to start the tunnel", error)
            teardown()
            stopSelf()

            START_NOT_STICKY
        }
    }

    private fun startEngine(configJson: String, fd: Int, autoReconnect: Boolean) {
        val started = TunnelEngine.nativeStart(
            applicationInfo.nativeLibraryDir,
            filesDir.absolutePath,
            configJson,
            fd,
            autoReconnect,
        )

        if (started == 0) {
            throw IllegalStateException("TunnelEngine.nativeStart rejected the config")
        }
    }

    private fun startVpnForeground(server: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(server),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED,
            )
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(server))
        }
    }

    private fun openDescriptor(dns: Array<String>, server: String, tunAddress: String): Int {
        startVpnForeground(server)

        val interfaceAddress = parseInterfaceAddress(tunAddress)

        val builder = Builder()
            .setSession(SESSION)
            .setMtu(MTU)
            .addAddress(interfaceAddress.first, interfaceAddress.second)

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
        isStopping = false
        cancelRevival()
        acquireWakeLock()
        watchNetwork()
        VpnTileService.requestUpdate(this)

        return opened.fd
    }

    private fun watchNetwork() {
        if (networkCallback != null) {
            return
        }

        val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return

        activeNetwork = runCatching {
            manager.allNetworks.firstOrNull { candidate ->
                val caps = manager.getNetworkCapabilities(candidate)

                caps != null &&
                    caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                    caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN) &&
                    caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            }
        }.getOrNull()

        activeNetwork?.let(::bindUnderlying)

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                if (activeNetwork == network) {
                    return
                }

                val previous = activeNetwork
                activeNetwork = network
                bindUnderlying(network)

                if (previous != null) {
                    Log.i(TAG, "underlying network changed; restarting the engine")
                    TunnelEngine.nativeNetworkChanged()
                }
            }

            override fun onLost(network: Network) {
                if (activeNetwork == network) {
                    activeNetwork = null
                }
            }
        }

        runCatching { manager.registerDefaultNetworkCallback(callback) }
            .onSuccess {
                networkCallback = callback
                Log.i(TAG, "watching the underlying network")
            }
            .onFailure { error ->
                Log.e(TAG, "cannot watch the network; the tunnel will not survive a switch", error)
            }
    }

    private fun bindUnderlying(network: Network) {
        runCatching { setUnderlyingNetworks(arrayOf(network)) }
            .onFailure { error -> Log.w(TAG, "cannot bind the tunnel to the network", error) }
    }

    private fun unwatchNetwork() {
        val callback = networkCallback ?: return
        val manager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

        runCatching { manager?.unregisterNetworkCallback(callback) }

        networkCallback = null
        activeNetwork = null
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) {
            return
        }

        runCatching {
            val manager = getSystemService(Context.POWER_SERVICE) as PowerManager

            wakeLock = manager
                .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG)
                .apply {
                    setReferenceCounted(false)
                    acquire()
                }
        }.onFailure { error ->
            Log.w(TAG, "cannot hold a wake lock; the tunnel may stall in doze", error)
        }
    }

    private fun releaseWakeLock() {
        runCatching {
            wakeLock?.takeIf { it.isHeld }?.release()
        }

        wakeLock = null
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

    private fun parseInterfaceAddress(address: String): Pair<String, Int> {
        val parts = address.split('/', limit = 2)
        val host = parts.firstOrNull()?.takeIf { it.isNotBlank() } ?: TUN_ADDRESS
        val prefix = parts.getOrNull(1)?.toIntOrNull()?.takeIf { it in 0..32 } ?: TUN_PREFIX

        return host to prefix
    }

    private fun intToIp(value: Long): String =
        "${(value shr 24) and 0xFF}.${(value shr 16) and 0xFF}.${(value shr 8) and 0xFF}.${value and 0xFF}"

    private fun connectedLabel(): String =
        if (java.util.Locale.getDefault().language == "ru") "Подключено" else "Connected"

    private fun buildNotification(server: String): Notification {
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
            .setContentText("${connectedLabel()} · $server")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(open)
            .setOngoing(true)
            .build()
    }

    private fun teardown() {
        unwatchNetwork()
        releaseWakeLock()
        runCatching { TunnelEngine.nativeStop() }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_DETACH)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(false)
        }

        descriptor?.close()
        descriptor = null
        publish(this, false)
        VpnTileService.requestUpdate(this)

        notificationManager().cancel(NOTIFICATION_ID)
    }

    private fun notificationManager(): NotificationManager =
        getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    override fun onRevoke() {
        Log.w(TAG, "vpn permission revoked by the system")
        isStopping = true
        teardown()
        stopSelf()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        Log.i(TAG, "task swiped away; keeping the tunnel alive")
    }

    private fun scheduleRevival() {
        val manager = getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        val pending = revivalIntent(PendingIntent.FLAG_UPDATE_CURRENT) ?: return

        runCatching {
            manager.set(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + REVIVAL_DELAY_MS,
                pending,
            )
        }.onFailure { error -> Log.w(TAG, "cannot schedule a revival", error) }
    }

    private fun revivalIntent(flag: Int): PendingIntent? {
        val intent = Intent(this, GnomeVpnService::class.java).setAction(ACTION_START_FROM_TILE)
        val flags = PendingIntent.FLAG_IMMUTABLE or flag

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PendingIntent.getForegroundService(this, REVIVAL_REQUEST, intent, flags)
        } else {
            PendingIntent.getService(this, REVIVAL_REQUEST, intent, flags)
        }
    }

    private fun cancelRevival() {
        val manager = getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val pending = revivalIntent(PendingIntent.FLAG_NO_CREATE) ?: return

        runCatching { manager.cancel(pending) }
        pending.cancel()
    }

    override fun onDestroy() {
        val wasRunning = descriptor != null

        teardown()

        if (!isStopping && wasRunning && TunnelStore.load(this) != null) {
            Log.w(TAG, "destroyed with a live session; scheduling a revival")
            scheduleRevival()
        }

        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "ru.gnomevpn.app.STOP"
        const val ACTION_START_FROM_TILE = "ru.gnomevpn.app.START_FROM_TILE"

        private const val TAG = "GnomeVpn"
        private const val REVIVAL_REQUEST = 100
        private const val REVIVAL_DELAY_MS = 5_000L
        private const val WAKE_LOCK_TAG = "GnomeVPN::tunnel"
        private const val SESSION = "GnomeVPN"
        private const val CHANNEL_ID = "gnomevpn.tunnel"
        private const val CHANNEL_NAME = "Tunnel"
        private const val NOTIFICATION_ID = 1
        private const val START_TIMEOUT_SECONDS = 15L
        private const val POLL_INTERVAL_MS = 150L

        private const val TUN_ADDRESS = "10.8.0.2"
        private const val TUN_PREFIX = 24
        private const val MTU = 1420

        // Half routes rather than 0.0.0.0/0: replacing the physical default
        // route strands the device if the tunnel dies before it is torn down.
        private const val ROUTE_LOWER_HALF = "0.0.0.0"
        private const val ROUTE_UPPER_HALF = "128.0.0.0"

        private val DEFAULT_DNS = arrayOf("1.1.1.1", "8.8.8.8")

        private const val STATE_PREFS = "gnomevpn.tunnel.state"
        private const val KEY_RUNNING = "running"

        @Suppress("DEPRECATION")
        private fun statePrefs(context: Context) =
            context.applicationContext.getSharedPreferences(
                STATE_PREFS,
                Context.MODE_PRIVATE or Context.MODE_MULTI_PROCESS,
            )

        @JvmStatic
        fun publish(context: Context, isRunning: Boolean) {
            statePrefs(context).edit().putBoolean(KEY_RUNNING, isRunning).commit()
        }

        @JvmStatic
        fun isRunning(context: Context): Boolean {
            if (!statePrefs(context).getBoolean(KEY_RUNNING, false)) {
                return false
            }

            if (isServiceAlive(context)) {
                return true
            }

            publish(context, false)

            return false
        }

        private fun isServiceAlive(context: Context): Boolean {
            val manager =
                context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
                    ?: return false

            val name = GnomeVpnService::class.java.name

            return runCatching {
                @Suppress("DEPRECATION")
                manager.getRunningServices(Int.MAX_VALUE).any { it.service.className == name }
            }.getOrDefault(false)
        }

        @JvmStatic
        fun start(context: Context) {
            val intent = Intent(context, GnomeVpnService::class.java)
                .setAction(ACTION_START_FROM_TILE)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun awaitRunning(context: Context): Boolean {
            val deadline = SystemClock.elapsedRealtime() + START_TIMEOUT_SECONDS * 1000

            while (SystemClock.elapsedRealtime() < deadline) {
                if (isRunning(context)) {
                    return true
                }

                Thread.sleep(POLL_INTERVAL_MS)
            }

            return false
        }
    }
}
