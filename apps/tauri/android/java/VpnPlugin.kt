package app.gnomevpn.mobile

import android.app.Activity
import android.content.Intent
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
    var dns: List<String> = emptyList()
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

    // The descriptor only exists once the service has finished establishing the
    // tunnel, so the wait happens off the caller's thread to avoid an ANR.
    private fun launchService(invoke: Invoke, args: StartArgs) {
        val intent = Intent(activity, GnomeVpnService::class.java)
            .putExtra(GnomeVpnService.EXTRA_SERVER, args.server)
            .putExtra(GnomeVpnService.EXTRA_DNS, args.dns.toTypedArray())

        try {
            activity.startForegroundService(intent)
        } catch (error: Throwable) {
            invoke.reject("cannot start the vpn service: ${error.message}")

            return
        }

        thread(name = "gnomevpn-tunnel-start") {
            val fd = GnomeVpnService.awaitDescriptor()

            if (fd == GnomeVpnService.NO_DESCRIPTOR) {
                invoke.reject("the vpn service did not open a tunnel")

                return@thread
            }

            val result = JSObject()
            result.put("fd", fd)
            invoke.resolve(result)
        }
    }

    @Command
    fun stop(invoke: Invoke) {
        activity.startService(
            Intent(activity, GnomeVpnService::class.java).setAction(GnomeVpnService.ACTION_STOP),
        )

        invoke.resolve()
    }
}
