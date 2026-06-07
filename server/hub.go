package main

import (
	"sync"
)

// Hub maps join codes to running Room goroutines. It is the ONLY place that
// uses a mutex on shared state; each Room owns its own state on its own
// goroutine, so game logic stays mutex-free.
type Hub struct {
	mu    sync.Mutex
	rooms map[string]*Room
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]*Room)}
}

func (h *Hub) Run() {} // reserved for future global tasks

// GetOrCreate returns the room for code, creating (and starting) it if needed.
func (h *Hub) GetOrCreate(code string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()
	if r, ok := h.rooms[code]; ok {
		return r
	}
	r := NewRoom(code, func() {
		h.mu.Lock()
		delete(h.rooms, code)
		h.mu.Unlock()
	})
	h.rooms[code] = r
	go r.Run()
	return r
}
