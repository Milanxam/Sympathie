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
    name: "Pizza Toppings",
    prompt: "Rank these pizza toppings from best to worst",
    cards: [
      emoji("pizza-pepperoni", "🍕", "Pepperoni"),
      emoji("pizza-mushroom", "🍄", "Mushroom"),
      emoji("pizza-pineapple", "🍍", "Pineapple"),
      emoji("pizza-pepper", "🫑", "Peppers"),
      emoji("pizza-cheese", "🧀", "Extra Cheese"),
    ],
  },
  {
    id: "animals",
    name: "Best Pets",
    prompt: "Rank these animals from best pet to worst pet",
    cards: [
      emoji("pet-dog", "🐶", "Dog"),
      emoji("pet-cat", "🐱", "Cat"),
      emoji("pet-fish", "🐟", "Fish"),
      emoji("pet-snake", "🐍", "Snake"),
      emoji("pet-parrot", "🦜", "Parrot"),
    ],
  },
  {
    id: "weekend",
    name: "Weekend Vibes",
    prompt: "Rank these from your ideal weekend to your worst",
    cards: [
      emoji("wk-beach", "🏖️", "Beach Day"),
      emoji("wk-game", "🎮", "Gaming"),
      emoji("wk-hike", "🥾", "Hiking"),
      emoji("wk-party", "🎉", "Party"),
      emoji("wk-sleep", "😴", "Sleep In"),
    ],
  },
  {
    id: "breakfast",
    name: "Breakfast Foods",
    prompt: "Rank these breakfasts from best to worst",
    cards: [
      emoji("bf-pancakes", "🥞", "Pancakes"),
      emoji("bf-eggs", "🍳", "Eggs"),
      emoji("bf-cereal", "🥣", "Cereal"),
      emoji("bf-bacon", "🥓", "Bacon"),
      emoji("bf-fruit", "🍓", "Fruit"),
    ],
  },
  {
    id: "superpowers",
    name: "Superpowers",
    prompt: "Rank these superpowers from most to least desirable",
    cards: [
      emoji("sp-fly", "🕊️", "Flight"),
      emoji("sp-invis", "👻", "Invisibility"),
      emoji("sp-time", "⏳", "Time Travel"),
      emoji("sp-strong", "💪", "Super Strength"),
      emoji("sp-mind", "🧠", "Telepathy"),
    ],
  },
  {
    id: "vacation",
    name: "Dream Vacation",
    prompt: "Rank these vacation spots from dream to nightmare",
    cards: [
      emoji("vac-paris", "🗼", "Paris"),
      emoji("vac-tokyo", "🏯", "Tokyo"),
      emoji("vac-safari", "🦁", "Safari"),
      emoji("vac-ski", "🎿", "Ski Trip"),
      emoji("vac-cruise", "🚢", "Cruise"),
    ],
  },
];

export const PROMPT_SUGGESTIONS = [
  "Rank these from best to worst",
  "Rank these from most to least overrated",
  "Rank these by how much the group would enjoy them",
  "Rank these from most to least essential",
  "Rank these from coziest to most stressful",
];
