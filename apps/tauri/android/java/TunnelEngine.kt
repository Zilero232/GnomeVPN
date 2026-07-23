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
    ): Int

    external fun nativeStop()
}
