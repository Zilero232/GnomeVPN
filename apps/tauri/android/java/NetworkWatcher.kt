package ru.gnomevpn.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log

class NetworkWatcher(
    private val context: Context,
    private val onNetworkBound: (Network) -> Unit,
    private val onPathChanged: () -> Unit,
) {
    private val handler = Handler(Looper.getMainLooper())
    private var callback: ConnectivityManager.NetworkCallback? = null
    private var wakeReceiver: BroadcastReceiver? = null

    private var current: Network? = null
    private var validated = false

    fun start() {
        watchNetwork()
        watchWake()
    }

    fun stop() {
        val manager = connectivity()

        callback?.let { runCatching { manager?.unregisterNetworkCallback(it) } }
        callback = null

        wakeReceiver?.let { runCatching { context.unregisterReceiver(it) } }
        wakeReceiver = null

        current = null
        validated = false
    }

    private fun connectivity(): ConnectivityManager? =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

    private fun watchNetwork() {
        if (callback != null) {
            return
        }

        val manager = connectivity() ?: return

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val watcher = object : ConnectivityManager.NetworkCallback() {
            override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                val isUsable = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

                if (network == current && isUsable == validated) {
                    return
                }

                val isHandover = validated && (network != current)

                current = network
                validated = isUsable

                onNetworkBound(network)

                if (isUsable && isHandover) {
                    Log.i(TAG, "underlying path validated on a new network; redialling")
                    onPathChanged()
                }
            }

            override fun onLost(network: Network) {
                if (network != current) {
                    return
                }

                validated = false
            }
        }

        val registered = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                manager.registerBestMatchingNetworkCallback(request, watcher, handler)
            } else {
                manager.registerNetworkCallback(request, watcher, handler)
            }
        }

        registered
            .onSuccess {
                callback = watcher
                Log.i(TAG, "watching the underlying network")
            }
            .onFailure { error ->
                Log.e(TAG, "cannot watch the network; the tunnel will not survive a switch", error)
            }
    }

    private fun watchWake() {
        if (wakeReceiver != null) {
            return
        }

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                Log.i(TAG, "device woke (${intent?.action}); checking the tunnel")
                onPathChanged()
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_USER_PRESENT)
            addAction(Intent.ACTION_SCREEN_ON)
        }

        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                context.registerReceiver(receiver, filter)
            }
        }
            .onSuccess {
                wakeReceiver = receiver
                Log.i(TAG, "watching for wake-ups")
            }
            .onFailure { error -> Log.w(TAG, "cannot watch for wake-ups", error) }
    }

    private companion object {
        const val TAG = "GnomeVpn"
    }
}
