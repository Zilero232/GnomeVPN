package ru.gnomevpn.app

object TunnelEngine {
    init {
        System.loadLibrary("gnomevpn_lib")
    }

    external fun nativeStart(
        nativeLibDir: String,
        dataDir: String,
        configJson: String,
        fd: Int,
        autoReconnect: Boolean,
    ): Int

    external fun nativeStop()

    external fun nativeNetworkChanged()

    external fun nativeTrafficRx(): Long

    external fun nativeTrafficTx(): Long
}
