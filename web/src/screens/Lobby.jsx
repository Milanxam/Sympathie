import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crown, LogOut, Play, Users } from "lucide-react";
import { Screen, Brand, Button, Avatar, Pill, Lightbox } from "../components/ui.jsx";
import DeckManager from "../components/DeckManager.jsx";
import JoinQR from "../components/JoinQR.jsx";
import { builtinLibrary } from "../decks.js";
import { joinUrl } from "../net.js";

// Lobby shows the join code and players. The host also builds the shared deck
// library here (synced to the server) and starts the game, which advances
// everyone to the first ranker's prompt phase.
export default function Lobby({
  state,
  myId,
  isHost,
  code,
  nextRound,
  setDecks,
  onLeave,
}) {
  const [copied, setCopied] = useState(false);
  const [enlarged, setEnlarged] = useState(null);
  const players = state.players || [];

  // Host keeps an authoritative local copy of the deck library and syncs it to
  // the server on every change. Seeded once with the built-in emoji decks so
  // there's always something playable.
  const [decks, setLocalDecks] = useState(null);
  const [activeDeckId, setActiveDeckId] = useState("");
  const seeded = useRef(false);

  useEffect(() => {
    if (!isHost || seeded.current) return;
    seeded.current = true;
    const existing = state.decks && state.decks.length ? state.decks : null;
    const lib = existing || builtinLibrary();
    const active =
      state.activeDeckId && lib.some((d) => d.id === state.activeDeckId)
        ? state.activeDeckId
        : lib[0]?.id || "";
    setLocalDecks(lib);
    setActiveDeckId(active);
    if (!existing) setDecks(lib, active); // push the seed to the server
  }, [isHost, state.decks, state.activeDeckId, setDecks]);

  function handleDecksChange(nextDecks, nextActive) {
    setLocalDecks(nextDecks);
    setActiveDeckId(nextActive);
    setDecks(nextDecks, nextActive);
  }

  function copyCode() {
    let ok = false;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(done).catch(() => fallback());
      return;
    }
    fallback();
    function fallback() {
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
      if (ok) done();
    }
  }

  const playableDecks = (decks || []).filter((d) => d.cards.length >= 5);
  const canStart = isHost && players.length >= 2 && playableDecks.length > 0;

  return (
    <Screen>
      <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />

      <div className="mb-5 flex items-center justify-between">
        <Brand small />
        <button
          onClick={onLeave}
          className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 ring-1 ring-slate-700"
        >
          <LogOut className="h-4 w-4" /> Leave
        </button>
      </div>

      <div className="mb-5 rounded-3xl bg-slate-900 p-5 text-center ring-1 ring-slate-800">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Room code
        </p>
        <p className="text-5xl font-black tracking-[0.3em] text-violet-300">
          {code}
        </p>
        <button
          onClick={copyCode}
          className="mx-auto mt-3 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy code
            </>
          )}
        </button>
        <JoinQR url={joinUrl(code)} code={code} />
      </div>

      <div className="mb-4 flex items-center gap-2 text-slate-300">
        <Users className="h-5 w-5" />
        <h2 className="text-base font-bold">
          Players <span className="text-slate-500">({players.length})</span>
        </h2>
      </div>

      <ul className="mb-5 flex flex-col gap-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 ring-1 ring-slate-800"
          >
            <Avatar name={p.name} id={p.id} />
            <span className="flex-1 truncate font-semibold">
              {p.name}
              {p.id === myId && <span className="text-slate-500"> (you)</span>}
            </span>
            {p.host && (
              <Pill tone="amber">
                <Crown className="h-3.5 w-3.5" /> Host
              </Pill>
            )}
          </li>
        ))}
        {players.length === 0 && (
          <li className="rounded-2xl bg-slate-900 px-4 py-6 text-center text-slate-500 ring-1 ring-slate-800">
            Waiting for players to join…
          </li>
        )}
      </ul>

      {isHost && decks && (
        <div className="mb-5">
          <DeckManager
            decks={decks}
            activeDeckId={activeDeckId}
            onChange={handleDecksChange}
            onZoom={setEnlarged}
          />
        </div>
      )}

      <div className="mt-auto pt-2">
        {isHost ? (
          <>
            <Button onClick={nextRound} disabled={!canStart}>
              <Play className="h-5 w-5" /> Start Game
            </Button>
            {!canStart && (
              <p className="mt-2 text-center text-xs text-slate-500">
                {players.length < 2
                  ? "Need at least 2 players — one ranks, the rest guess."
                  : "Add a deck with at least 5 cards to start."}
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-slate-400">
            Waiting for the host to start…
          </p>
        )}
      </div>
    </Screen>
  );
}
