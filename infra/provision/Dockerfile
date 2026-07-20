# syntax=docker/dockerfile:1
#
# GnomeVPN node provisioner — a one-shot image, not a service.
#
# Deliberately separate from apps/server/Dockerfile: this image carries an SSH
# client and, at runtime, the root passwords of every VPN node. The API
# container is reachable from the internet, so those two must not share a
# filesystem. Provisioning runs, exits, and leaves nothing behind.
#
# The build context MUST be the monorepo root — the script imports Prisma, the
# wg-easy client and upsertNode from apps/server:
#   docker build -f infra/provision/Dockerfile -t gnomevpn-provision .
#
# Run it on the VPS, joined to the compose network so it can reach Postgres:
#   docker run --rm --network gnomevpn_gnomevpn \
#     --env-file .env \
#     -v "$PWD/nodes.json:/app/infra/provision/nodes.json:ro" \
#     -v "$PWD/.env:/app/apps/server/.env" \
#     gnomevpn-provision --backend-ip=<api container ip>
#
# The env file is passed twice on purpose: Docker's --env-file populates the
# process environment (base-prisma validates the full server schema at import),
# while the mount is the file the script APPENDS WG_KEY_XX to.

FROM oven/bun:1.3.14 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
# --frozen-lockfile validates the workspace topology, so every member listed in
# the lockfile needs its manifest present — even the ones this image never runs.
COPY apps/client/package.json ./apps/client/package.json
COPY apps/tauri/package.json ./apps/tauri/package.json
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app /app

COPY packages/schemas ./packages/schemas
COPY apps/server/src ./apps/server/src
COPY apps/server/scripts ./apps/server/scripts
COPY apps/server/prisma ./apps/server/prisma
COPY apps/server/package.json apps/server/prisma.config.ts ./apps/server/
COPY infra/provision ./infra/provision
COPY infra/wg-easy ./infra/wg-easy

# `generate` never connects, so a placeholder satisfies prisma.config.ts without
# baking a real connection string into the image.
RUN cd apps/server \
    && DIRECT_URL="postgresql://placeholder" DATABASE_URL="postgresql://placeholder" bunx prisma generate

# nodes.json and .env are mounted at run time, never copied in — the image is
# pushed to a registry and must stay free of credentials.
#
# No --env-file here: bun resolves it against the working directory, and the
# variables already arrive through the container environment. The mounted .env
# is written to, not read from.
ENTRYPOINT ["bun", "infra/provision/provision-nodes.ts"]
