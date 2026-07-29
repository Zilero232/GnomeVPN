package ru.gnomevpn.app

import java.io.File

// Bytes the kernel counted on the tunnel interface.
//
// The UI process cannot see the engine's counters — the tunnel runs in :tunnel —
// so it reads the same interface statistics the engine watches for stalls.
object TunnelTraffic {
    private const val PROC_NET_DEV = "/proc/net/dev"
    private const val RX_BYTES_COLUMN = 0
    private const val TX_BYTES_COLUMN = 8
    private const val TUN_PREFIX = "tun"

    data class Counters(val rx: Long, val tx: Long)

    fun read(): Counters {
        val lines = runCatching { File(PROC_NET_DEV).readLines() }.getOrDefault(emptyList())

        var rx = 0L
        var tx = 0L

        for (line in lines) {
            val separator = line.indexOf(':')

            if (separator < 0 || !line.substring(0, separator).trim().startsWith(TUN_PREFIX)) {
                continue
            }

            val columns = line.substring(separator + 1).trim().split(Regex("\\s+"))
            val lineRx = columns.getOrNull(RX_BYTES_COLUMN)?.toLongOrNull() ?: continue
            val lineTx = columns.getOrNull(TX_BYTES_COLUMN)?.toLongOrNull() ?: continue

            rx += lineRx
            tx += lineTx
        }

        return Counters(rx, tx)
    }
}
