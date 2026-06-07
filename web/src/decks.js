// Built-in emoji decks and prompt suggestions used by the host on the Prompt
// screen. Each deck is exactly 5 cards. Card ids are stable within a deck so
// the server can tally consensus by id.

let idCounter = 0;
export function newId(prefix = "c") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}
export function newCardId() {
  return newId("c");
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// drawCards picks n cards from a deck's pool (random order).
export function drawCards(deck, n = 5) {
  return shuffle(deck?.cards || []).slice(0, n);
}

// builtinLibrary returns the emoji decks as library decks (id, name, cards),
// used to seed a room's deck library so there's always something playable.
export function builtinLibrary() {
  return EMOJI_DECKS.map((d) => ({
    id: d.id,
    name: d.name,
    cards: d.cards,
  }));
}

// promptForDeck suggests a prompt for a deck id (falls back to a generic one).
export function promptForDeck(deckId) {
  const d = EMOJI_DECKS.find((x) => x.id === deckId);
  return d?.prompt || PROMPT_SUGGESTIONS[0];
}

function emoji(id, e, label) {
  return { id, type: "emoji", emoji: e, label };
}

export const EMOJI_DECKS = [
  {
    id: "pizza",
    name: "Pizza-Beläge",
    prompt: "Sortiere diese Pizza-Beläge von am besten bis am schlechtesten",
    cards: [
      emoji("pizza-pepperoni", "🍕", "Salami"),
      emoji("pizza-mushroom", "🍄", "Champignons"),
      emoji("pizza-pineapple", "🍍", "Ananas"),
      emoji("pizza-pepper", "🫑", "Paprika"),
      emoji("pizza-cheese", "🧀", "Extra Käse"),
    ],
  },
  {
    id: "animals",
    name: "Beste Haustiere",
    prompt: "Sortiere diese Tiere vom besten zum schlechtesten Haustier",
    cards: [
      emoji("pet-dog", "🐶", "Hund"),
      emoji("pet-cat", "🐱", "Katze"),
      emoji("pet-fish", "🐟", "Fisch"),
      emoji("pet-snake", "🐍", "Schlange"),
      emoji("pet-parrot", "🦜", "Papagei"),
    ],
  },
  {
    id: "weekend",
    name: "Wochenend-Vibes",
    prompt: "Sortiere vom perfekten zum schlimmsten Wochenende",
    cards: [
      emoji("wk-beach", "🏖️", "Strandtag"),
      emoji("wk-game", "🎮", "Zocken"),
      emoji("wk-hike", "🥾", "Wandern"),
      emoji("wk-party", "🎉", "Party"),
      emoji("wk-sleep", "😴", "Ausschlafen"),
    ],
  },
  {
    id: "breakfast",
    name: "Frühstück",
    prompt: "Sortiere diese Frühstücke von am besten bis am schlechtesten",
    cards: [
      emoji("bf-pancakes", "🥞", "Pfannkuchen"),
      emoji("bf-eggs", "🍳", "Eier"),
      emoji("bf-cereal", "🥣", "Müsli"),
      emoji("bf-bacon", "🥓", "Speck"),
      emoji("bf-fruit", "🍓", "Obst"),
    ],
  },
  {
    id: "superpowers",
    name: "Superkräfte",
    prompt: "Sortiere diese Superkräfte von am begehrtesten bis am wenigsten",
    cards: [
      emoji("sp-fly", "🕊️", "Fliegen"),
      emoji("sp-invis", "👻", "Unsichtbarkeit"),
      emoji("sp-time", "⏳", "Zeitreise"),
      emoji("sp-strong", "💪", "Superkraft"),
      emoji("sp-mind", "🧠", "Gedankenlesen"),
    ],
  },
  {
    id: "vacation",
    name: "Traumurlaub",
    prompt: "Sortiere diese Reiseziele vom Traum zum Albtraum",
    cards: [
      emoji("vac-paris", "🗼", "Paris"),
      emoji("vac-tokyo", "🏯", "Tokio"),
      emoji("vac-safari", "🦁", "Safari"),
      emoji("vac-ski", "🎿", "Skiurlaub"),
      emoji("vac-cruise", "🚢", "Kreuzfahrt"),
    ],
  },
];

export const PROMPT_SUGGESTIONS = [
  "Sortiere von am besten bis am schlechtesten",
  "Sortiere von am meisten bis am wenigsten überbewertet",
  "Sortiere danach, wie sehr die Gruppe sie mag",
  "Sortiere von unverzichtbar bis überflüssig",
  "Sortiere von gemütlich bis stressig",
];
