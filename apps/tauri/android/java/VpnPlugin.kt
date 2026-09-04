package ru.gnomevpn.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import androidx.activity.result.ActivityResult
import androidx.core.content.FileProvider
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.File
import kotlin.concurrent.thread

@InvokeArg
class StartArgs {
    var server: String = ""
    var dns: List<String> = emptyList()
    var tunAddress: String = ""
    var configJson: String = ""
}

@InvokeArg
class AutoReconnectArgs {
    var enabled: Boolean = true
}

@InvokeArg
class ShareConfigArgs {
    var fileName: String = ""
    var content: String = ""
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
    fun isBatteryUnrestricted(invoke: Invoke) {
        val result = JSObject()

        result.put("granted", isIgnoringBatteryOptimizations())
        invoke.resolve(result)
    }

    @Command
    fun requestBatteryUnrestricted(invoke: Invoke) {
        val result = JSObject()

        if (isIgnoringBatteryOptimizations()) {
            result.put("granted", true)
            invoke.resolve(result)

            return
        }

        val opened = runCatching {
            activity.startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + activity.packageName)),
            )
        }.recoverCatching {
            activity.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }.isSuccess

        result.put("granted", false)
        result.put("opened", opened)
        invoke.resolve(result)
    }

    private fun isIgnoringBatteryOptimizations(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true
        }

        val manager = activity.getSystemService(Activity.POWER_SERVICE) as? PowerManager ?: return true

        return manager.isIgnoringBatteryOptimizations(activity.packageName)
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
                dns = args.dns,
                tunAddress = args.tunAddress,
                configJson = args.configJson,
            ),
        )

        try {
            GnomeVpnService.start(activity)
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

    private fun uptimeSeconds(since: Long): Long {
        if (since <= 0) {
            return 0
        }

        return ((SystemClock.elapsedRealtime() - since) / 1_000).coerceAtLeast(0)
    }

    @Command
    fun traffic(invoke: Invoke) {
        val counters = TunnelTraffic.read(activity)
        val result = JSObject()

        result.put("rx", counters.rx)
        result.put("tx", counters.tx)
        result.put("uptimeSeconds", uptimeSeconds(counters.since))
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

        val needsAttention = activity.intent?.getBooleanExtra(
            VpnTileService.EXTRA_NEEDS_ATTENTION,
            false,
        ) ?: false

        if (requested) {
            activity.intent?.removeExtra(VpnTileService.EXTRA_AUTO_CONNECT)
            activity.intent?.removeExtra(VpnTileService.EXTRA_NEEDS_ATTENTION)
        }

        val result = JSObject()
        result.put("requested", requested)
        result.put("needsAttention", needsAttention)
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
    fun shareConfig(invoke: Invoke) {
        val args = invoke.parseArgs(ShareConfigArgs::class.java)

        val shared = runCatching {
            val dir = File(activity.cacheDir, "shared").apply { mkdirs() }
            val file = File(dir, args.fileName)
            file.writeText(args.content)

            val uri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                file,
            )

            val send = Intent(Intent.ACTION_SEND)
                .setType("application/octet-stream")
                .putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)

            val chooser = Intent.createChooser(send, args.fileName)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            activity.startActivity(chooser)
        }.isSuccess

        val result = JSObject()
        result.put("shared", shared)
        invoke.resolve(result)
    }

    @Command
    fun stop(invoke: Invoke) {
        val intent = Intent(activity, GnomeVpnService::class.java)
            .setAction(GnomeVpnService.ACTION_STOP)

        activity.startService(intent)
        invoke.resolve()
    }
}
