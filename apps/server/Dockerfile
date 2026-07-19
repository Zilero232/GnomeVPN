# syntax=docker/dockerfile:1
#
# GnomeVPN API server — NestJS on the Bun runtime.
#
# The build context MUST be the monorepo root, because the server depends on the
# `@gnomevpn/schemas` workspace package. Build from the repo root with:
#   docker build -f apps/server/Dockerfile -t gnomevpn-server .
#
# Bun runs the TypeScript source directly, so there is no separate compile step —
# we only install dependencies and generate the Prisma client.

FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Copy only the manifests first so Docker caches the install layer and skips
# reinstalling when only source code changes.
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
# --frozen-lockfile validates the workspace topology against the lockfile, so
# every member listed there must have its manifest present — even unused ones.
COPY apps/client/package.json ./apps/client/package.json
COPY apps/tauri/package.json ./apps/tauri/package.json
# `bun install` would trigger the server's postinstall (prisma generate) before
# the schema is copied, so lifecycle scripts are disabled and generate runs later.
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS runner
ENV NODE_ENV=production

# Bun workspaces nest dependencies under each package's own node_modules, so the
# whole installed tree comes over to keep the resolution graph intact.
COPY --from=deps /app /app

COPY packages/schemas ./packages/schemas
COPY apps/server ./apps/server

WORKDIR /app/apps/server

# prisma.config.ts resolves DIRECT_URL through env(), which throws when unset.
# `generate` never connects to the database, so a placeholder satisfies it
# without baking a secret into the image.
RUN DIRECT_URL="postgresql://placeholder" DATABASE_URL="postgresql://placeholder" bunx prisma generate

EXPOSE 4000

CMD ["bun", "src/main.ts"]
