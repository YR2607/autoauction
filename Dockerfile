# AutoAuction — single-node deployment with SQLite.
# Build:  docker build -t autoauction .
# Run:    docker run -p 3100:3100 \
#           -v aa-data:/app/data \
#           -v aa-uploads:/app/public/uploads \
#           autoauction
FROM node:22-alpine AS deps
WORKDIR /app
# better-sqlite3 compiles from source on musl (no prebuilt alpine binary).
RUN apk add --no-cache python3 make g++
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# Changing this requires an image rebuild — never put secrets here.
ARG NEXT_PUBLIC_CONTACT_EMAIL=""
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build /app ./
# SQLite db + private documents live on a persistent volume.
RUN mkdir -p /app/data /app/public/uploads && chown -R app:app /app/data /app/public/uploads
USER app
EXPOSE 3100
# Initialize schema on first boot, then serve.
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
