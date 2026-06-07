import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crown, LogOut, Play, Users } from "lucide-react";
import {
  Screen,
  Brand,
  Button,
  Avatar,
  Pill,
  Lightbox,
} from "../components/ui.jsx";
import DeckManager from "../components/DeckManager.jsx";
import JoinQR from "../components/JoinQR.jsx";
import { builtinLibrary } from "../decks.js";
import { joinUrl } from "../net.js";

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
    if (!existing) setDecks(lib, active);
  }, [isHost, state.decks, state.activeDeckId, setDecks]);

  function handleDecksChange(nextDecks, nextActive) {
    setLocalDecks(nextDecks);
    setActiveDeckId(nextActive);
    setDecks(nextDecks, nextActive);
  }

  function copyCode() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(done).catch(fallback);
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
        if (document.execCommand("copy")) done();
        document.body.removeChild(ta);
      } catch {
        /* noop */
      }
    }
  }

  const playableDecks = (decks || []).filter((d) => d.cards.length >= 5);
  const canStart = isHost && players.length >= 2 && playableDecks.length > 0;

  const startHint =
    players.length < 2
      ? "Mindestens 2 Spieler nötig – einer ordnet, die anderen raten."
      : "Füge ein Deck mit mindestens 5 Karten hinzu.";

  const footer = isHost ? (
    <div>
      <Button onClick={nextRound} disabled={!canStart}>
        <Play className="h-5 w-5" /> Spiel starten
      </Button>
      {!canStart && (
        <p className="mt-2 text-center text-xs text-faint">{startHint}</p>
      )}
    </div>
  ) : (
    <p className="py-2 text-center text-sm text-muted">
      Warte, bis der Gastgeber startet…
    </p>
  );

  return (
    <Screen footer={footer}>
      <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />

      <div className="mb-4 flex shrink-0 items-center justify-between">
        <Brand small />
        <button
          onClick={onLeave}
          className="flex min-h-11 items-center gap-1 rounded-full bg-surface-muted px-3 py-2 text-xs font-semibold text-soft ring-1 ring-border"
        >
          <LogOut className="h-4 w-4" /> Verlassen
        </button>
      </div>

      <div className="mb-4 shrink-0 rounded-2xl bg-surface p-4 text-center ring-1 ring-border">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
          Raum-Code
        </p>
        <p className="text-4xl font-black tracking-[0.25em] text-accent sm:text-5xl">
          {code}
        </p>
        <button
          onClick={copyCode}
          className="mx-auto mt-3 flex min-h-11 items-center gap-2 rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-primary ring-1 ring-border"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" /> Kopiert
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Code kopieren
            </>
          )}
        </button>
        <JoinQR url={joinUrl(code)} code={code} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <div className="mb-3 flex items-center gap-2 text-soft">
          <Users className="h-5 w-5" />
          <h2 className="text-base font-bold">
            Spieler <span className="text-faint">({players.length})</span>
          </h2>
        </div>

        <ul className="mb-4 flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-border"
            >
              <Avatar name={p.name} id={p.id} />
              <span className="flex-1 truncate font-semibold text-primary">
                {p.name}
                {p.id === myId && <span className="text-faint"> (du)</span>}
              </span>
              {p.host && (
                <Pill tone="amber">
                  <Crown className="h-3.5 w-3.5" /> Gastgeber
                </Pill>
              )}
            </li>
          ))}
          {players.length === 0 && (
            <li className="rounded-2xl bg-surface px-4 py-6 text-center text-muted ring-1 ring-border">
              Warte auf Spieler…
            </li>
          )}
        </ul>

        {isHost && decks && (
          <DeckManager
            decks={decks}
            activeDeckId={activeDeckId}
            onChange={handleDecksChange}
            onZoom={setEnlarged}
          />
        )}
      </div>
    </Screen>
  );
}
