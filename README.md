# Kindred

A real-time, multiplayer party game about how well you know each other. Players
join a shared room from their phones with a 4-digit code. Each round one player
is the **ranker**: they pick a prompt + a deck of 5 cards and secretly rank
them. Everyone else, on their own phones, **guesses the ranker's order**. You
score one point per position you guessed correctly. The ranker rotates every
round, so everyone gets a turn. Guess your friends — be *kindred*.

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/eb9454ed-742f-4758-aaaa-934c91ef8194"
    alt="App screenshot 1"
    height="500"
  />
  &nbsp;&nbsp;
  <img
    src="https://github.com/user-attachments/assets/92fddead-7c85-42c6-82ed-48a4dee15b21"
    alt="App screenshot 2"
    height="500"
  />
</p>

```
phases:  lobby → prompt → ranking → reveal → (prompt | gameOver)
```

## Architecture

- **Backend (Go + gorilla/websocket).** Actor-style: one goroutine per room owns
  that room's state, so game logic is plain sequential code with no mutexes. Only
  the hub uses a mutex, purely to map join codes → rooms. The server is the
  single source of truth and broadcasts the full game state after every change.
- **Frontend (React + Vite + Tailwind).** A pure renderer of the server `state`.
  It never computes scores; it just stores the latest `state` and
  `myId` and draws the screen for the current phase. Drag-to-reorder uses
  `framer-motion`.

> **All state lives in memory on a single instance.** A restart wipes active
> games and you can run only **one** instance. This is intentional for a casual,
> short-session game. Scaling horizontally would require sticky routing on the
> join code (so a room's connections all land on one instance) or moving room
> state into Redis with Pub/Sub — not built here.

```
.
├── server/          # Go backend (main, hub, room, client) + /upload, /healthz
├── web/             # React frontend (Vite)
├── Dockerfile       # multi-stage: build web → build Go → distroless runtime
├── Caddyfile        # TLS termination so the browser can use wss://
└── test-client.html # raw websocket client for poking at the room loop
```

## Local development

You need **Go 1.22+** and **Node 18+**.

### 1. Run the backend

```bash
cd server
go mod download
go run .
# Kindred server listening on :8080
```

This serves `/ws`, `POST /upload`, `/uploads/*`, and `GET /healthz` on
`http://localhost:8080`. (It also serves a built frontend from `./static` if one
is present, but in dev you use Vite instead.)

Sanity-check the room loop without the React app by opening `test-client.html`
in a browser, or:

```bash
curl http://localhost:8080/healthz   # -> ok
```

### 2. Run the frontend

```bash
cd web
npm install
npm run dev
# Vite on http://localhost:5173
```

In dev the frontend connects the websocket directly to
`ws://localhost:8080/ws` and proxies `/upload` + `/uploads` to the Go server
(see `web/vite.config.js`). Open `http://localhost:5173` in a couple of browser
tabs (or phones on the same network) to play.

To point the frontend at a different backend, set env vars before building/
running:

```bash
VITE_WS_BASE=wss://kindred.example.com   # websocket origin
VITE_HTTP_BASE=https://kindred.example.com  # /upload + image origin (optional)
```

## Build & deploy

### Single container (recommended)

The Dockerfile builds the frontend, compiles a static Go binary, and serves
both from one origin (so `wss://` and `/upload` share the host):

```bash
docker build -t kindred .
docker run -p 8080:8080 kindred
```

Now `http://localhost:8080` serves the full app.

### TLS with Caddy

Browsers require `wss://` (secure WebSockets) on HTTPS pages. Put Caddy in front
to terminate TLS — it auto-provisions Let's Encrypt certs and proxies WebSocket
upgrades transparently:

1. Point a domain at your host and edit `Caddyfile` (replace
   `kindred.example.com`).
2. Run the container (`docker run -p 8080:8080 kindred`).
3. Run Caddy: `caddy run --config ./Caddyfile`.

Visit `https://kindred.example.com` and the frontend will automatically use
`wss://kindred.example.com/ws`.

### Split deploy: frontend on Vercel + backend elsewhere

> **Important:** Vercel can host the **frontend only**. The Go server keeps all
> game state in memory and relies on long-lived WebSocket connections, which
> Vercel's stateless, short-lived serverless functions cannot run. Host the Go
> backend on a platform that supports persistent processes + WebSockets — e.g.
> **Fly.io, Railway, Render, or a VPS with Caddy** (use the `Dockerfile`).

1. **Deploy the backend** somewhere with WebSocket support and get its public
   HTTPS URL, e.g. `https://kindred-api.fly.dev`. (The included `Dockerfile`
   builds a single static binary; most of these platforms deploy it directly.)
2. **Deploy the frontend to Vercel:**
   - Import this GitHub repo into Vercel.
   - Set **Root Directory** to `web` (Project → Settings → General).
   - Vercel auto-detects Vite (see `web/vercel.json`).
   - Add **Environment Variables** (Project → Settings → Environment Variables),
     pointing at your backend (see `web/.env.example`):
     - `VITE_WS_BASE = wss://kindred-api.fly.dev`
     - `VITE_HTTP_BASE = https://kindred-api.fly.dev`
   - Deploy. The Vercel URL serves the app; the websocket + uploads go to the
     backend.
3. The lobby shows a **QR code** that encodes `https://<your-vercel-app>/?join=<code>`.
   Scanning it opens the app with the code pre-filled so guests can join in one
   tap.

> Make sure the backend's `CheckOrigin` (in `main.go`) allows your Vercel
> origin before going public.

## WebSocket protocol

**Server → client**

```jsonc
{ "type": "hello", "you": "<clientId>", "hostId": "<id>" }
{ "type": "state", "state": { /* GameState */ } }
```

`GameState`:

```jsonc
{
  "phase": "lobby|prompt|ranking|reveal|gameOver",
  "hostId": "string",   // controls game flow (start / next / end)
  "rankerId": "string", // whose secret order everyone guesses this round
  "round": 0,
  "prompt": "string",
  "players": [{ "id", "name", "score", "host" }],
  "cards": [{ "id", "type", "emoji", "label", "src" }],
  "lockedIn": { "<playerId>": ["cardId", ...] },
  "result": { "answer": ["cardId", ...], "roundScore": { "<playerId>": 0 } }
}
```

`result.answer` is the ranker's true order. `lockedIn` reveals *who* has locked
in (for the "n/m locked" indicator) but the frontend does not show other
players' actual orders until `phase === "reveal"`.

**Client → server**

```jsonc
{ "type": "join", "name": "Sam" }
{ "type": "startRound", "prompt": "...", "cards": [ ... ] }  // ranker only
{ "type": "lockIn", "order": ["cardId", ...] }
{ "type": "nextRound" }                                       // host only
{ "type": "endGame" }                                         // host only
```

The server rejects `startRound` from anyone but the current round's ranker, and
`nextRound`/`endGame` from non-hosts. "Start Game" (lobby), "Next Round", and
"Play Again" all use `nextRound`, which advances the round, rotates the ranker
(round-robin by player id), and moves the room into the `prompt` phase so the new
ranker can build their deck.

## Scoring

The ranker's locked order is the answer. Each guesser earns 1 point per position
where their guess matches the ranker's order (0–5). The ranker scores 0 on their
own round. Round scores add to running totals, and the ranker rotates each round
so everyone gets a turn as the subject.

## Production hardening (TODO)

- Restrict `CheckOrigin` to your frontend origin.
- Rate-limit room creation and uploads.
- The join code is validated to 4 digits; consider collision/abuse handling.
