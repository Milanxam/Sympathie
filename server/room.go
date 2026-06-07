package main

import (
	"encoding/json"
	"sort"
	"time"
)

// ---------------------------------------------------------------------------
// Actor-style room: one goroutine owns ALL of this room's state, so the game
// logic below is plain sequential code with no mutexes. The server is the
// single source of truth; after any state change it broadcasts the full game
// state to every client. Clients are dumb renderers and never compute scores
// or consensus themselves.
// ---------------------------------------------------------------------------

// ---- wire types ----

type Card struct {
	ID    string `json:"id"`
	Type  string `json:"type"` // "emoji" | "image"
	Emoji string `json:"emoji,omitempty"`
	Label string `json:"label,omitempty"`
	Src   string `json:"src,omitempty"` // image URL (not base64, ideally)
	C1    string `json:"c1,omitempty"`
	C2    string `json:"c2,omitempty"`
}

type Player struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
	Host  bool   `json:"host"`
}

// Deck is a named pool of cards the host builds in the lobby. Each round draws
// 5 cards from the chosen deck. Shared via game state so any ranker can use it.
type Deck struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Cards []Card `json:"cards"`
}

type Result struct {
	Answer     []string       `json:"answer"`     // the ranker's true order
	RoundScore map[string]int `json:"roundScore"` // points each player earned
}

// GameState is exactly what the front-end renders.
type GameState struct {
	Phase        string              `json:"phase"`
	HostID       string              `json:"hostId"`
	RankerID     string              `json:"rankerId"` // whose order everyone guesses
	Round        int                 `json:"round"`
	Prompt       string              `json:"prompt"`
	Players      []Player            `json:"players"`
	Cards        []Card              `json:"cards"`
	Decks        []Deck              `json:"decks"`        // host-built deck library
	ActiveDeckID string              `json:"activeDeckId"` // default deck for rounds
	LockedIn     map[string][]string `json:"lockedIn"`
	Result       *Result             `json:"result"`
}

// Incoming message from a client.
type Incoming struct {
	Type   string   `json:"type"`
	Name   string   `json:"name,omitempty"`
	Prompt string   `json:"prompt,omitempty"`
	Cards  []Card   `json:"cards,omitempty"`
	Order  []string `json:"order,omitempty"`
	Decks  []Deck   `json:"decks,omitempty"`
	DeckID string   `json:"deckId,omitempty"`
}

// envelope pairs a parsed message with its sender.
type envelope struct {
	client *Client
	msg    Incoming
}

type Room struct {
	code         string
	clients      map[*Client]bool
	players      map[string]*Player // keyed by client id
	hostID       string
	rankerID     string // the player whose order everyone else guesses this round
	round        int
	prompt       string
	cards        []Card
	decks        []Deck
	activeDeckID string
	lockedIn     map[string][]string
	result       *Result
	phase        string

	register   chan *Client
	unregister chan *Client
	inbound    chan envelope
	onEmpty    func()
}

func NewRoom(code string, onEmpty func()) *Room {
	return &Room{
		code:       code,
		clients:    make(map[*Client]bool),
		players:    make(map[string]*Player),
		lockedIn:   make(map[string][]string),
		phase:      "lobby",
		register:   make(chan *Client),
		unregister: make(chan *Client),
		inbound:    make(chan envelope, 64),
		onEmpty:    onEmpty,
	}
}

func (r *Room) Run() {
	// Auto-close the room if it sits idle (no events) for a while.
	const idleTTL = 2 * time.Hour
	idle := time.NewTimer(idleTTL)
	defer idle.Stop()
	resetIdle := func() {
		if !idle.Stop() {
			select {
			case <-idle.C:
			default:
			}
		}
		idle.Reset(idleTTL)
	}

	for {
		resetIdle()
		select {
		case c := <-r.register:
			r.clients[c] = true
			// First connection becomes host; if the current host is gone
			// (e.g. a dropped connection), this client inherits the role.
			r.ensureHost(c)
			c.sendJSON(map[string]any{"type": "hello", "you": c.id, "hostId": r.hostID})
			r.broadcast()

		case c := <-r.unregister:
			if r.clients[c] {
				delete(r.clients, c)
				delete(r.players, c.id)
				delete(r.lockedIn, c.id)
				close(c.send)
			}
			if len(r.clients) == 0 {
				r.onEmpty()
				return
			}
			// If the host just left, hand the role to a remaining client.
			r.ensureHost(nil)
			r.maybeFinalize()
			r.broadcast()

		case e := <-r.inbound:
			r.handle(e)

		case <-idle.C:
			// Safety net: if a room somehow lingers, close it out.
			r.onEmpty()
			return
		}
	}
}

// clientByID returns the connected client with the given id, or nil.
func (r *Room) clientByID(id string) *Client {
	for c := range r.clients {
		if c.id == id {
			return c
		}
	}
	return nil
}

// ensureHost guarantees hostID points at a currently-connected client. If the
// existing host is still connected it is left untouched; otherwise `prefer`
// (when connected) or any remaining client becomes the new host.
func (r *Room) ensureHost(prefer *Client) {
	if r.hostID != "" && r.clientByID(r.hostID) != nil {
		return
	}
	if prefer != nil {
		r.hostID = prefer.id
		return
	}
	for c := range r.clients {
		r.hostID = c.id
		return
	}
	r.hostID = ""
}

func (r *Room) handle(e envelope) {
	isHost := e.client.id == r.hostID
	switch e.msg.Type {

	case "join":
		r.players[e.client.id] = &Player{
			ID: e.client.id, Name: e.msg.Name, Host: e.client.id == r.hostID,
		}

	case "setDecks": // host only — update the shared deck library
		if !isHost {
			return
		}
		r.decks = e.msg.Decks
		r.activeDeckID = e.msg.DeckID

	case "startRound": // ranker only — they pick the prompt + deck for their round
		if e.client.id != r.rankerID {
			return
		}
		r.prompt = e.msg.Prompt
		r.cards = e.msg.Cards
		r.lockedIn = make(map[string][]string)
		r.result = nil
		r.phase = "ranking"

	case "lockIn":
		if _, ok := r.players[e.client.id]; !ok {
			return
		}
		r.lockedIn[e.client.id] = e.msg.Order
		r.maybeFinalize()

	case "nextRound": // host only — advance to the next round and rotate ranker
		if !isHost {
			return
		}
		r.advanceRound()

	case "endGame":
		if !isHost {
			return
		}
		r.phase = "gameOver"
	}
	r.broadcast()
}

// sortedPlayerIDs returns player ids in a stable order (matching broadcast) so
// the ranker rotation is deterministic.
func (r *Room) sortedPlayerIDs() []string {
	ids := make([]string, 0, len(r.players))
	for id := range r.players {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// advanceRound moves into the next round's prompt phase and rotates the ranker
// round-robin through the players.
func (r *Room) advanceRound() {
	ids := r.sortedPlayerIDs()
	if len(ids) == 0 {
		return
	}
	r.round++
	r.rankerID = ids[(r.round-1)%len(ids)]
	r.prompt = ""
	r.cards = nil
	r.lockedIn = make(map[string][]string)
	r.result = nil
	r.phase = "prompt"
}

// maybeFinalize scores the round once every present player has locked in. The
// ranker's locked order is the "answer"; every other player (a guesser) earns
// one point per position where their guess matches the ranker's order. The
// ranker scores 0 on their own round — everyone gets a turn as ranker.
func (r *Room) maybeFinalize() {
	if r.phase != "ranking" || len(r.players) == 0 {
		return
	}
	if len(r.lockedIn) < len(r.players) {
		return
	}

	answer := r.lockedIn[r.rankerID] // may be empty if the ranker dropped
	n := len(answer)

	roundScore := map[string]int{}
	for pid, p := range r.players {
		if pid == r.rankerID {
			roundScore[pid] = 0
			continue
		}
		order := r.lockedIn[pid]
		s := 0
		for i := 0; i < n && i < len(order); i++ {
			if order[i] == answer[i] {
				s++
			}
		}
		roundScore[pid] = s
		p.Score += s
	}

	r.result = &Result{Answer: answer, RoundScore: roundScore}
	r.phase = "reveal"
}

// broadcast snapshots state and sends it to every client.
func (r *Room) broadcast() {
	players := make([]Player, 0, len(r.players))
	for _, p := range r.players {
		// Keep the host flag in sync with the (possibly reassigned) hostID.
		p.Host = p.ID == r.hostID
		players = append(players, *p)
	}
	// stable order so the UI doesn't jump around
	sort.Slice(players, func(i, j int) bool { return players[i].ID < players[j].ID })

	state := GameState{
		Phase: r.phase, HostID: r.hostID, RankerID: r.rankerID, Round: r.round,
		Prompt: r.prompt, Players: players, Cards: r.cards,
		Decks: r.decks, ActiveDeckID: r.activeDeckID,
		LockedIn: r.lockedIn, Result: r.result,
	}
	data, _ := json.Marshal(map[string]any{"type": "state", "state": state})

	for c := range r.clients {
		select {
		case c.send <- data:
		default: // client too slow; drop it
			delete(r.clients, c)
			delete(r.players, c.id)
			close(c.send)
		}
	}
}
