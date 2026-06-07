import { useMemo, useState } from "react";
import { Eye, Play, Shuffle } from "lucide-react";
import { Screen, Brand, Button, CardFace, Lightbox } from "../components/ui.jsx";
import {
  PROMPT_SUGGESTIONS,
  builtinLibrary,
  drawCards,
  promptForDeck,
} from "../decks.js";

// PromptScreen is the ranker's round setup. The deck library comes from the
// server (built by the host in the lobby); the ranker picks the active deck by
// default but can change the deck, reshuffle the 5 drawn cards, and edit the
// prompt for their turn. Non-rankers see a waiting state.
export default function PromptScreen({ state, isRanker, rankerId, startRound }) {
  const [enlarged, setEnlarged] = useState(null);

  const available = useMemo(() => {
    const lib = state.decks && state.decks.length ? state.decks : builtinLibrary();
    return lib.filter((d) => (d.cards?.length || 0) >= 5);
  }, [state.decks]);

  const [deckId, setDeckId] = useState(() => {
    const a = state.activeDeckId;
    if (a && available.some((d) => d.id === a)) return a;
    return available[0]?.id || "";
  });

  const selectedDeck = available.find((d) => d.id === deckId) || available[0];

  const [cards, setCards] = useState(() => drawCards(selectedDeck, 5));
  const [prompt, setPrompt] = useState(() => promptForDeck(selectedDeck?.id));

  const rankerName =
    (state.players || []).find((p) => p.id === rankerId)?.name || "Someone";

  if (!isRanker) {
    return (
      <Screen>
        <div className="mb-6">
          <Brand small />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-6xl">🃏</div>
          <h2 className="text-2xl font-bold">Get ready…</h2>
          <p className="max-w-xs text-slate-400">
            <span className="font-semibold text-violet-300">{rankerName}</span> is
            the ranker this round and is choosing the prompt and cards. You&apos;ll
            guess their order. Round {state.round}.
          </p>
        </div>
      </Screen>
    );
  }

  function selectDeck(id) {
    const deck = available.find((d) => d.id === id);
    if (!deck) return;
    setDeckId(id);
    setCards(drawCards(deck, 5));
    if (!prompt.trim()) setPrompt(promptForDeck(id));
  }

  function reshuffle() {
    setCards(drawCards(selectedDeck, 5));
  }

  const ready = prompt.trim().length > 0 && cards.length === 5;

  function start() {
    if (!ready) return;
    startRound(prompt.trim(), cards);
  }

  return (
    <Screen>
      <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />

      <div className="mb-4">
        <Brand small />
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-violet-300">
          <Eye className="h-4 w-4" /> Round {state.round} · You&apos;re the ranker
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Pick a prompt and a deck — everyone else will guess your secret order.
        </p>
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-slate-300">Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Rank these from best to worst…"
          className="w-full resize-none rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-slate-100 outline-none ring-1 ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700"
            >
              {s}
            </button>
          ))}
        </div>
      </label>

      <div className="mb-3">
        <p className="mb-2 text-sm font-semibold text-slate-300">Deck</p>
        <div className="flex flex-wrap gap-2">
          {available.map((d) => (
            <button
              key={d.id}
              onClick={() => selectDeck(d.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                d.id === deckId
                  ? "bg-violet-500 text-white ring-violet-400"
                  : "bg-slate-800 text-slate-300 ring-slate-700"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-400">
            This round&apos;s cards
          </span>
          <button
            onClick={reshuffle}
            className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-700"
          >
            <Shuffle className="h-3.5 w-3.5" /> Reshuffle
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <li key={card.id} className="rounded-xl bg-slate-800 px-3 py-2">
              <CardFace card={card} compact onZoom={setEnlarged} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <Button onClick={start} disabled={!ready}>
          <Play className="h-5 w-5" /> Start Round
        </Button>
        {!ready && (
          <p className="mt-2 text-center text-xs text-slate-500">
            Write a prompt to begin.
          </p>
        )}
      </div>
    </Screen>
  );
}
