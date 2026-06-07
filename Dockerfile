# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Kindred — single static binary that serves the API, the websocket, uploaded
# images, and the built React app from one origin.
#
# Stage 1 builds the frontend, stage 2 builds the Go binary, and the runtime is
# a distroless static image (no shell, tiny attack surface).
# ---------------------------------------------------------------------------

# ----- Stage 1: build the React frontend -----------------------------------
FROM node:20-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ----- Stage 2: build the Go server ----------------------------------------
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
# Static, stripped binary for the distroless runtime.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/kindred .
# Pre-create a writable uploads dir owned by the nonroot user.
RUN mkdir -p /out/uploads

# ----- Stage 3: runtime ----------------------------------------------------
FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=build /out/kindred /app/kindred
COPY --from=build --chown=nonroot:nonroot /out/uploads /app/uploads
COPY --from=web /web/dist /app/static

EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/kindred"]
