package ru.gnomevpn.app

import android.app.Activity
import android.content.Intent
import android.net.TrafficStats
import android.net.VpnService
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import kotlin.concurrent.thread

@InvokeArg
class StartArgs {
    var server: String = ""
    var port: Int = 0
    var auth: String = ""
    var serverName: String = ""
    var insecure: Boolean = true
    var dns: List<String> = emptyList()
}

@InvokeArg
class AutoReconnectArgs {
    var enabled: Boolean = true
}

@TauriPlugin
class VpnPlugin(private val activity: Activity) : Plugin(activity) {
    private var pendingArgs: StartArgs? = null

    @Command
    fun hasPermission(invoke: Invoke) {
        val result = JSObject()
        result.put("granted", VpnService.prepare(activity) == null)
        invoke.resolve(result)
    }

    @Command
    fun requestPermission(invoke: Invoke) {
        val consent = VpnService.prepare(activity)

        if (consent == null) {
            val result = JSObject()
            result.put("granted", true)
            invoke.resolve(result)

            return
        }

        startActivityForResult(invoke, consent, "onPermissionResult")
    }

    @ActivityCallback
    fun onPermissionResult(invoke: Invoke, result: ActivityResult) {
        val granted = JSObject()
        granted.put("granted", result.resultCode == Activity.RESULT_OK)
        invoke.resolve(granted)
    }

    // Android extracts jniLibs to an install-specific directory, so the path
    // has to be read from the system rather than assembled by hand.
    @Command
    fun nativeLibraryDir(invoke: Invoke) {
        val result = JSObject()
        result.put("path", activity.applicationInfo.nativeLibraryDir)
        invoke.resolve(result)
    }

    @Command
    fun start(invoke: Invoke) {
        val args = invoke.parseArgs(StartArgs::class.java)
        val consent = VpnService.prepare(activity)

        if (consent == null) {
            launchService(invoke, args)

            return
        }

        pendingArgs = args
        startActivityForResult(invoke, consent, "onConsent")
    }

    @ActivityCallback
    fun onConsent(invoke: Invoke, result: ActivityResult) {
        val args = pendingArgs
        pendingArgs = null

        if (result.resultCode != Activity.RESULT_OK || args == null) {
            invoke.reject("vpn permission was declined")

            return
        }

        launchService(invoke, args)
    }

    private fun launchService(invoke: Invoke, args: StartArgs) {
        TunnelStore.save(
            activity,
            TunnelSnapshot(
                server = args.server,
                port = args.port,
                auth = args.auth,
                serverName = args.serverName,
                insecure = args.insecure,
                dns = args.dns,
            ),
        )

        val intent = Intent(activity, GnomeVpnService::class.java)
            .setAction(GnomeVpnService.ACTION_START_FROM_TILE)

        try {
            activity.startForegroundService(intent)
        } catch (error: Throwable) {
            invoke.reject("cannot start the vpn service: ${error.message}")

            return
        }

        thread(name = "gnomevpn-tunnel-start") {
            if (!GnomeVpnService.awaitRunning(activity)) {
                invoke.reject("the vpn service did not open a tunnel")

                return@thread
            }

            invoke.resolve()
        }
    }

    // TrafficStats counts the whole app, and every socket the tunnel opens
    // belongs to it, so the totals track the tunnel for as long as it runs.
    @Command
    fun traffic(invoke: Invoke) {
        val uid = activity.applicationInfo.uid
        val result = JSObject()

        result.put("rx", TrafficStats.getUidRxBytes(uid).coerceAtLeast(0))
        result.put("tx", TrafficStats.getUidTxBytes(uid).coerceAtLeast(0))
        invoke.resolve(result)
    }

    @Command
    fun setAutoReconnect(invoke: Invoke) {
        TunnelStore.setAutoReconnect(activity, invoke.parseArgs(AutoReconnectArgs::class.java).enabled)
        invoke.resolve()
    }

    @Command
    fun forgetTunnel(invoke: Invoke) {
        TunnelStore.clear(activity)
        invoke.resolve()
    }

    @Command
    fun consumeAutoConnect(invoke: Invoke) {
        val requested = activity.intent?.getBooleanExtra(
            VpnTileService.EXTRA_AUTO_CONNECT,
            false,
        ) ?: false

        if (requested) {
            activity.intent?.removeExtra(VpnTileService.EXTRA_AUTO_CONNECT)
        }

        val result = JSObject()
        result.put("requested", requested)
        invoke.resolve(result)
    }

    @Command
    fun moveToBackground(invoke: Invoke) {
        activity.moveTaskToBack(true)
        invoke.resolve()
    }

    @Command
    fun isRunning(invoke: Invoke) {
        val result = JSObject()
        result.put("running", GnomeVpnService.isRunning(activity))
        invoke.resolve(result)
    }

    @Command
    fun openVpnSettings(invoke: Invoke) {
        val intent = Intent("android.net.vpn.SETTINGS")
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

        val opened = runCatching { activity.startActivity(intent) }.isSuccess

        if (!opened) {
            runCatching {
                activity.startActivity(
                    Intent(android.provider.Settings.ACTION_SETTINGS)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                )
            }
        }

        invoke.resolve()
    }

    @Command
    fun stop(invoke: Invoke) {
        val intent = Intent(activity, GnomeVpnService::class.java)
            .setAction(GnomeVpnService.ACTION_STOP)

        activity.startService(intent)
        invoke.resolve()
    }
}
