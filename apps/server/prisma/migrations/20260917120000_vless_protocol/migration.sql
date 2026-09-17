-- Hysteria2 rides on QUIC, which means UDP. Some networks — corporate Wi-Fi,
-- a few mobile carriers, most hotels — drop UDP wholesale, and there the tunnel
-- cannot come up at all. VLESS + Reality is the fallback: TCP on 443, wearing
-- the TLS handshake of a real third-party site. The two share port 443 without
-- conflict because one is UDP and the other TCP.
--
-- `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block, and Prisma
-- wraps every migration in one. Postgres 12+ permits it as the only statement
-- of its own migration, which is why this file holds nothing else.

ALTER TYPE "TunnelProtocol" ADD VALUE IF NOT EXISTS 'vless';
