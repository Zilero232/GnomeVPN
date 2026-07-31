# syntax=docker/dockerfile:1
#
# GnomeVPN web client — static Next.js export served by Caddy.
#
# The build context MUST be the monorepo root, because the client depends on the
# `@gnomevpn/schemas` and `@gnomevpn/server` (type-only) workspace packages.
# Build from the repo root with:
#   docker build -f apps/client/Dockerfile -t gnomevpn-web .
#
# This image serves the landing page and the account area. The desktop app talks
# to the API directly, so nothing here proxies the tunnel.
#
# NEXT_PUBLIC_* values are baked into the static bundle at build time and must be
# passed as build args — they are not secrets, they ship to the browser.

FROM oven/bun:1.3.14 AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json bun.lock tsconfig.json ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
COPY packages/scripts/package.json ./packages/scripts/package.json
# --frozen-lockfile validates the workspace topology, so the tauri manifest must
# be present even though this image never builds the desktop app.
COPY apps/tauri/package.json ./apps/tauri/package.json
# Lifecycle scripts are off because the server's postinstall runs
# `prisma generate` before its schema is copied in.
# A retry loop that wipes the download cache between attempts survives transient
# registry hiccups that corrupt a tarball mid-download (IntegrityCheckFailed).
RUN for attempt in 1 2 3; do \
      bun install --frozen-lockfile --ignore-scripts && break; \
      echo "bun install attempt $attempt failed; clearing cache and retrying"; \
      rm -rf /root/.bun/install/cache ~/.bun/install/cache; \
    done

COPY packages/schemas ./packages/schemas
COPY apps/server ./apps/server
COPY apps/client ./apps/client

# The client imports types from apps/server, which reference the generated Prisma
# client. It must exist before the Next.js typecheck runs.
RUN cd apps/server && DIRECT_URL="postgresql://placeholder" DATABASE_URL="postgresql://placeholder" bunx prisma generate


RUN bun --filter @gnomevpn/client build

FROM caddy:2-alpine AS runner

COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/client/out /srv/www

EXPOSE 80 443
