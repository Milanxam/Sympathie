import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Crown, Eye, Flag } from "lucide-react";
import { Screen, Brand, Button, Avatar, CardFace, Lightbox } from "../components/ui.jsx";
import { resolveSrc } from "../net.js";

// Reveal shows the ranker's real order and how well each guesser matched it.
// All values come from the server `result`; the client computes nothing except
// the per-position highlight for display.
export default function Reveal({
  state,
  myId,
  rankerId,
  nextRound,
  endGame,
  isHost,
}) {
  const [enlarged, setEnlarged] = useState(null);
  const result = state.result || { answer: [], roundScore: {} };
  const cardById = useMemo(() => {
    const m = {};
    (state.cards || []).forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [state.cards]);

  const answer = result.answer || [];
  const lockedIn = state.lockedIn || {};
  const rankerName =
    (state.players || []).find((p) => p.id === rankerId)?.name || "The ranker";

  const guessers = (state.players || []).filter((p) => p.id !== rankerId);
  const leaderboard = [...(state.players || [])].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );

  return (
    <Screen>
      <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />

      <div className="mb-4 text-center">
        <Brand small />
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Round {state.round} · The reveal
        </p>
      </div>

      <div className="mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 p-3 ring-1 ring-violet-500/30">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-violet-200">
          <Eye className="h-4 w-4" /> {rankerName}&apos;s real ranking
        </p>
        <p className="mb-2 text-xs text-slate-400">{state.prompt}</p>
        <ul className="flex flex-col gap-1.5">
          {answer.map((id, i) => (
            <motion.li
              key={`answer-${i}-${id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl bg-slate-900/70 px-3 py-1.5"
            >
              <CardFace card={cardById[id]} rank={i + 1} compact onZoom={setEnlarged} />
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-bold text-slate-300">How everyone guessed</p>
        <div className="flex flex-col gap-2">
          {guessers.map((p) => {
            const guess = lockedIn[p.id] || [];
            const pts = result.roundScore?.[p.id] ?? 0;
            const mine = p.id === myId;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-3 ring-1 ${
                  mine ? "bg-slate-800 ring-violet-500/40" : "bg-slate-900 ring-slate-800"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Avatar name={p.name} id={p.id} size="sm" />
                  <span className="flex-1 truncate font-semibold">
                    {p.name}
                    {mine && <span className="text-slate-500"> (you)</span>}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                    +{pts} ({pts}/{answer.length})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {guess.map((id, i) => {
                    const ok = answer[i] === id;
                    const card = cardById[id];
                    return (
                      <button
                        key={`${p.id}-${i}-${id}`}
                        type="button"
                        onClick={() => setEnlarged(card)}
                        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg ring-2 ${
                          ok ? "ring-emerald-400" : "ring-slate-700 opacity-60"
                        }`}
                      >
                        {card?.type === "image" ? (
                          <img
                            src={resolveSrc(card.src)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{card?.emoji}</span>
                        )}
                        {ok && (
                          <span className="absolute bottom-0 right-0 rounded-tl bg-emerald-400 p-0.5">
                            <Check className="h-3 w-3 text-slate-900" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {guessers.length === 0 && (
            <p className="rounded-2xl bg-slate-900 px-4 py-4 text-center text-sm text-slate-500 ring-1 ring-slate-800">
              No guessers this round.
            </p>
          )}
        </div>
      </div>

      <div className="mb-2 flex-1">
        <p className="mb-2 text-sm font-bold text-slate-300">Leaderboard</p>
        <ul className="flex flex-col gap-2">
          {leaderboard.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 ring-1 ring-slate-800"
            >
              <span className="w-5 text-center text-sm font-black text-slate-500">
                {i + 1}
              </span>
              <Avatar name={p.name} id={p.id} size="sm" />
              <span className="flex-1 truncate font-semibold">
                {p.name}
                {p.id === rankerId && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-violet-300">
                    <Crown className="h-3 w-3" /> ranker
                  </span>
                )}
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                +{result.roundScore?.[p.id] ?? 0}
              </span>
              <span className="w-8 text-right text-lg font-black text-violet-300">
                {p.score}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <div className="mt-5 flex flex-col gap-3">
          <Button onClick={nextRound}>
            <ArrowRight className="h-5 w-5" /> Next Round
          </Button>
          <Button variant="secondary" onClick={endGame}>
            <Flag className="h-5 w-5" /> End Game
          </Button>
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-slate-400">
          Waiting for the host to continue…
        </p>
      )}
    </Screen>
  );
}
