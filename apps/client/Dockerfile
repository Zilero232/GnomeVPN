# syntax=docker/dockerfile:1
#
# GnomeVPN web client — Next.js server.
#
# The build context MUST be the monorepo root: the client depends on the
# `@gnomevpn/schemas` workspace package.
# Build from the repo root with:
#   docker build -f apps/client/Dockerfile -t gnomevpn-web .
#
# This image runs the Next.js server itself rather than shipping a static
# export: pages render per request, so SEO metadata and the landing page reflect
# server state instead of whatever was true at build time. Caddy sits in front
# of it and terminates TLS.
#
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time and
# must be passed as build args — they are not secrets, they ship to the browser.

FROM oven/bun:1.3.14 AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json bun.lock tsconfig.json ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
COPY packages/scripts/package.json ./packages/scripts/package.json

# Lifecycle scripts are off because the server's postinstall runs
# `prisma generate` before its schema is copied in.
# A retry loop that wipes the download cache between attempts survives transient
# registry hiccups that corrupt a tarball mid-download (IntegrityCheckFailed).
RUN for attempt in 1 2 3; do \
      bun install --frozen-lockfile --ignore-scripts && break; \
      echo "bun install attempt $attempt failed; clearing cache and retrying"; \
      rm -rf /root/.bun/install/cache ~/.bun/install/cache; \
    done

COPY packages/logger ./packages/logger
COPY packages/schemas ./packages/schemas
COPY apps/client ./apps/client

RUN bun --filter @gnomevpn/client build && test -f apps/client/.next/standalone/apps/client/server.js

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# `output: 'standalone'` traces the runtime dependencies into .next/standalone,
# laid out from `outputFileTracingRoot` — the monorepo root — so the server
# entrypoint keeps its apps/client prefix. static/ and public/ are not traced
# and are copied in beside it.
COPY --from=build --chown=nextjs:nodejs /app/apps/client/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/client/public ./apps/client/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/client/server.js"]
