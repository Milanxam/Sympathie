import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, Eye, GripVertical, Lock } from "lucide-react";
import { Screen, Brand, Button, Avatar, Lightbox } from "../components/ui.jsx";
import { resolveSrc } from "../net.js";

// One draggable row. Reordering is driven only by the grip handle, so tapping
// the card media instead opens the lightbox.
function RankRow({ card, index, onZoom }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={card.id}
      dragListener={false}
      dragControls={controls}
      className="select-none"
      whileDrag={{ scale: 1.03 }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-slate-800 px-3 py-3 ring-1 ring-slate-700">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onZoom(card)}
          className="shrink-0 cursor-zoom-in"
        >
          {card.type === "image" ? (
            <img
              src={resolveSrc(card.src)}
              alt={card.label || ""}
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-600"
            />
          ) : (
            <span className="text-4xl">{card.emoji}</span>
          )}
        </button>
        <span className="min-w-0 flex-1 truncate text-base font-semibold">
          {card.label}
        </span>
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none rounded-lg p-2 text-slate-500 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

// Ranking lets each player privately order the 5 cards and lock in. The ranker
// sets the secret "answer"; everyone else is guessing the ranker's order. It
// never shows other players' orders (those arrive at reveal).
export default function Ranking({ state, myId, rankerId, isRanker, lockIn }) {
  const [enlarged, setEnlarged] = useState(null);

  const cardById = useMemo(() => {
    const m = {};
    (state.cards || []).forEach((c) => {
      m[c.id] = c;
    });
    return m;
  }, [state.cards]);

  const signature = (state.cards || []).map((c) => c.id).join("|");
  const [order, setOrder] = useState(() => (state.cards || []).map((c) => c.id));

  useEffect(() => {
    setOrder((state.cards || []).map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const rankerName =
    (state.players || []).find((p) => p.id === rankerId)?.name || "the ranker";

  const lockedIds = state.lockedIn || {};
  const hasLocked = Object.prototype.hasOwnProperty.call(lockedIds, myId);
  const lockedCount = Object.keys(lockedIds).length;
  const total = (state.players || []).length;
  const others = (state.players || []).filter((p) => p.id !== myId);

  if (hasLocked) {
    const myOrder = lockedIds[myId] || order;
    return (
      <Screen>
        <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />
        <div className="mb-4">
          <Brand small />
        </div>
        <div className="rounded-3xl bg-slate-900 p-6 text-center ring-1 ring-slate-800">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">Locked in!</h2>
          <p className="mt-1 text-slate-400">
            Waiting for others — {lockedCount}/{total} locked
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-400">
            {isRanker ? "Your secret order" : `Your guess of ${rankerName}'s order`}
          </p>
          <ul className="flex flex-col gap-2 opacity-80">
            {myOrder.map((id, i) => (
              <li
                key={`${id}-${i}`}
                className="rounded-xl bg-slate-900 px-3 py-2 ring-1 ring-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnlarged(cardById[id])}
                    className="shrink-0 cursor-zoom-in"
                  >
                    {cardById[id]?.type === "image" ? (
                      <img
                        src={resolveSrc(cardById[id]?.src)}
                        alt=""
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{cardById[id]?.emoji}</span>
                    )}
                  </button>
                  <span className="truncate text-sm font-semibold">
                    {cardById[id]?.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {others.map((p) => {
            const done = Object.prototype.hasOwnProperty.call(lockedIds, p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${
                  done
                    ? "bg-emerald-500/15 ring-emerald-500/30"
                    : "bg-slate-800 ring-slate-700"
                }`}
              >
                <Avatar name={p.name} id={p.id} size="sm" />
                <span className="text-sm font-semibold">{p.name}</span>
                {done && <Check className="h-4 w-4 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <Lightbox card={enlarged} onClose={() => setEnlarged(null)} />
      <div className="mb-3">
        <Brand small />
      </div>
      <div
        className={`mb-4 rounded-2xl p-4 ring-1 ${
          isRanker
            ? "bg-violet-600/15 ring-violet-500/30"
            : "bg-slate-900 ring-slate-800"
        }`}
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300">
          {isRanker ? (
            <>
              <Eye className="h-3.5 w-3.5" /> You&apos;re the ranker · Round{" "}
              {state.round}
            </>
          ) : (
            <>Round {state.round}</>
          )}
        </p>
        <p className="mt-1 text-lg font-bold leading-snug">{state.prompt}</p>
        <p className="mt-1 text-sm text-slate-400">
          {isRanker
            ? "Set your true order — everyone else is trying to guess it."
            : `Guess how ${rankerName} ranked these.`}
        </p>
      </div>

      <p className="mb-2 text-sm text-slate-400">Drag to order — top is #1. Tap a card to enlarge.</p>

      <Reorder.Group
        axis="y"
        values={order}
        onReorder={setOrder}
        className="flex flex-1 flex-col gap-2"
      >
        {order.map((id, index) => (
          <RankRow
            key={id}
            card={cardById[id]}
            index={index}
            onZoom={setEnlarged}
          />
        ))}
      </Reorder.Group>

      <div className="mt-5">
        <Button onClick={() => lockIn(order)}>
          <Lock className="h-5 w-5" />{" "}
          {isRanker ? "Lock In Secret Order" : "Lock In Guess"}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          {lockedCount}/{total} players locked in
        </p>
      </div>
    </Screen>
  );
}
