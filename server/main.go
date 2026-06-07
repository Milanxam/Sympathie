package main

import (
	"crypto/rand"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
)

// ---------------------------------------------------------------------------
// Architectural note (intentional design):
//
//   ALL game state lives in memory on this single server instance. A restart
//   wipes every active game, and you can only run ONE instance. This is fine
//   for a casual, short-session party game.
//
//   TODO: Horizontal scaling would require sticky routing on the join code
//   (so every connection for a room lands on the same instance), or moving
//   room state into Redis with Pub/Sub. Do NOT build that now.
// ---------------------------------------------------------------------------

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// TODO: restrict this to your front-end origin in production.
	CheckOrigin: func(r *http.Request) bool { return true },
}

const uploadsDir = "./uploads"

func main() {
	hub := NewHub()
	go hub.Run()

	// ----- WebSocket endpoint ------------------------------------------------
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// client connects to /ws?code=ABCD&name=Sam
		code := normalizeCode(r.URL.Query().Get("code"))
		name := r.URL.Query().Get("name")
		if code == "" {
			http.Error(w, "missing or invalid code", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("upgrade error:", err)
			return
		}

		room := hub.GetOrCreate(code)
		client := &Client{
			id:   randID(),
			name: name,
			room: room,
			conn: conn,
			send: make(chan []byte, 32),
		}
		room.register <- client

		go client.writePump()
		go client.readPump()
	})

	// ----- Image upload ------------------------------------------------------
	// Accepts a multipart image and saves it to ./uploads/<randID>.<ext>.
	// Returns JSON {"url":"/uploads/<file>"}. Images travel as URLs, never as
	// base64 over the websocket.
	http.HandleFunc("/upload", handleUpload)

	// Serve uploaded images statically.
	if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
		log.Fatal("could not create uploads dir:", err)
	}
	http.Handle("/uploads/", http.StripPrefix("/uploads/",
		http.FileServer(http.Dir(uploadsDir))))

	// ----- Health check ------------------------------------------------------
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// ----- Static frontend ---------------------------------------------------
	// In production the built React app is copied into ./static and served from
	// the same origin (so wss:// and /upload share the host). For local dev you
	// instead run Vite separately and point it at ws://localhost:8080/ws.
	http.Handle("/", spaHandler("./static"))

	addr := ":8080"
	log.Println("Kindred server listening on", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

// handleUpload stores a single multipart image file under ./uploads.
func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Limit to ~8 MB per uploaded image.
	r.Body = http.MaxBytesReader(w, r.Body, 8<<20)
	if err := r.ParseMultipartForm(8 << 20); err != nil {
		http.Error(w, "file too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedImageExt[ext] {
		http.Error(w, "unsupported image type", http.StatusBadRequest)
		return
	}

	name := randID() + ext
	dst, err := os.Create(filepath.Join(uploadsDir, name))
	if err != nil {
		http.Error(w, "could not save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "could not write file", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"url": "/uploads/" + name})
}

var allowedImageExt = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true,
}

// spaHandler serves static files from dir, falling back to index.html for
// client-side routes. If dir does not exist (e.g. local dev) it returns 404.
func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		path := filepath.Join(dir, filepath.Clean(r.URL.Path))
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(dir, "index.html"))
	})
}

// normalizeCode validates a 4-digit numeric join code. Returns "" if the code
// is not exactly four ASCII digits.
func normalizeCode(code string) string {
	code = strings.TrimSpace(code)
	if len(code) != 4 {
		return ""
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			return ""
		}
	}
	return code
}

// randID generates a short unique id for players/messages/files.
func randID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = chars[int(b[i])%len(chars)]
	}
	return string(b)
}
