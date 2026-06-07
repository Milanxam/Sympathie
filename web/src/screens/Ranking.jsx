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
      <div className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3 ring-1 ring-border">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-bold text-accent">
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
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-border"
            />
          ) : (
            <span className="text-4xl">{card.emoji}</span>
          )}
        </button>
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-primary">
          {card.label}
        </span>
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none rounded-lg p-2 text-faint active:cursor-grabbing"
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
        <div className="rounded-3xl bg-surface p-6 text-center ring-1 ring-border">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-strong text-success">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-primary">Festgelegt!</h2>
          <p className="mt-1 text-muted">
            Warte auf andere — {lockedCount}/{total} bereit
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-muted">
            {isRanker
              ? "Deine geheime Reihenfolge"
              : `Dein Tipp für ${rankerName}s Reihenfolge`}
          </p>
          <ul className="flex flex-col gap-2 opacity-80">
            {myOrder.map((id, i) => (
              <li
                key={`${id}-${i}`}
                className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-primary">
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
                  <span className="truncate text-sm font-semibold text-primary">
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
                    ? "bg-success-muted ring-success-muted"
                    : "bg-surface-muted ring-border"
                }`}
              >
                <Avatar name={p.name} id={p.id} size="sm" />
                <span className="text-sm font-semibold text-primary">{p.name}</span>
                {done && <Check className="h-4 w-4 text-success" />}
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
            ? "bg-accent-muted ring-accent-muted"
            : "bg-surface ring-border"
        }`}
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          {isRanker ? (
            <>
              <Eye className="h-3.5 w-3.5" /> Du ordnest · Runde {state.round}
            </>
          ) : (
            <>Runde {state.round}</>
          )}
        </p>
        <p className="mt-1 text-lg font-bold leading-snug text-primary">{state.prompt}</p>
        <p className="mt-1 text-sm text-muted">
          {isRanker
            ? "Lege deine echte Reihenfolge fest – die anderen raten sie."
            : `Errate, wie ${rankerName} sortiert hat.`}
        </p>
      </div>

      <p className="mb-2 text-sm text-muted">
        Ziehen zum Sortieren — oben ist #1. Karte antippen zum Vergrößern.
      </p>

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
          {isRanker ? "Reihenfolge festlegen" : "Tipp abgeben"}
        </Button>
        <p className="mt-2 text-center text-xs text-faint">
          {lockedCount}/{total} Spieler bereit
        </p>
      </div>
    </Screen>
  );
}
