import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { resolveSrc } from "../net.js";

// ---- Screen scaffold -------------------------------------------------------

export function Screen({ children }) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
        {children}
      </div>
    </div>
  );
}

export function Brand({ small }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={small ? "text-2xl" : "text-4xl"}>🤝</span>
      <h1
        className={
          (small ? "text-2xl" : "text-4xl") +
          " font-black tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
        }
      >
        Kindred
      </h1>
    </div>
  );
}

// ---- Buttons ---------------------------------------------------------------

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    primary:
      "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/40 hover:from-violet-400 hover:to-fuchsia-400",
    secondary:
      "bg-slate-800 text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ---- Player avatar ---------------------------------------------------------

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-orange-500",
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function Avatar({ name, id, size = "md" }) {
  const color = AVATAR_COLORS[hashString(id || name || "?") % AVATAR_COLORS.length];
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${sizes[size]}`}
    >
      {initials || "?"}
    </div>
  );
}

// ---- Card faces ------------------------------------------------------------

// CardFace renders an emoji or image card. `compact` shrinks it for lists.
// When `onZoom` is passed, the media becomes a button that opens the lightbox.
export function CardFace({ card, rank, compact, onZoom }) {
  if (!card) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-slate-800 p-3 text-slate-500">
        ?
      </div>
    );
  }
  const media =
    card.type === "image" ? (
      <img
        src={resolveSrc(card.src)}
        alt={card.label || ""}
        className={
          (compact ? "h-10 w-10" : "h-14 w-14") +
          " shrink-0 rounded-xl object-cover ring-1 ring-slate-700"
        }
      />
    ) : (
      <span className={compact ? "text-3xl" : "text-4xl"}>{card.emoji}</span>
    );
  return (
    <div className="flex items-center gap-3">
      {rank != null && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-200">
          {rank}
        </span>
      )}
      {onZoom ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(card);
          }}
          className="shrink-0 cursor-zoom-in"
        >
          {media}
        </button>
      ) : (
        media
      )}
      {card.label && (
        <span className="truncate text-base font-semibold text-slate-100">
          {card.label}
        </span>
      )}
    </div>
  );
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ZoomableImage supports pinch-to-zoom (two fingers) and drag-to-pan (one
// finger while zoomed). Double-tap resets. Built on pointer events so it works
// on touch and trackpad without enabling page-wide zoom.
function ZoomableImage({ src, alt }) {
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        type: "pinch",
        startDist: dist(a, b) || 1,
        startScale: t.scale,
      };
    } else {
      gesture.current = {
        type: "pan",
        px: e.clientX,
        py: e.clientY,
        startX: t.x,
        startY: t.y,
      };
    }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const scale = clamp(g.startScale * (dist(a, b) / g.startDist), 1, 5);
      setT((p) => ({ ...p, scale }));
    } else if (g.type === "pan" && t.scale > 1) {
      setT((p) => ({
        ...p,
        x: g.startX + (e.clientX - g.px),
        y: g.startY + (e.clientY - g.py),
      }));
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setT((p) => (p.scale <= 1.03 ? { scale: 1, x: 0, y: 0 } : p));
    } else {
      const [pt] = [...pointers.current.values()];
      gesture.current = {
        type: "pan",
        px: pt.x,
        py: pt.y,
        startX: t.x,
        startY: t.y,
      };
    }
  }

  return (
    <div
      className="flex max-h-96 w-full touch-none items-center justify-center overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setT({ scale: 1, x: 0, y: 0 })}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          touchAction: "none",
        }}
        className="max-h-96 w-full select-none object-contain"
      />
    </div>
  );
}

// Lightbox shows a single card enlarged. Render it once per screen and pass the
// currently-enlarged card (or null) plus an onClose handler.
export function Lightbox({ card, onClose }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-5"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
          >
            <X className="h-5 w-5" /> Close
          </button>
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.85 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm items-center justify-center overflow-hidden rounded-3xl bg-slate-800"
          >
            {card.type === "image" ? (
              <ZoomableImage src={resolveSrc(card.src)} alt={card.label || ""} />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-4">
                <span className="text-8xl">{card.emoji}</span>
                {card.label && (
                  <span className="text-2xl font-bold text-white">
                    {card.label}
                  </span>
                )}
              </div>
            )}
          </motion.div>
          {card.label && card.type === "image" && (
            <p className="mt-3 text-base font-semibold text-white">{card.label}</p>
          )}
          <p className="mt-2 text-sm text-slate-400">
            {card.type === "image"
              ? "Pinch to zoom · double-tap to reset · tap outside to close"
              : "Tap anywhere to close"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Misc ------------------------------------------------------------------

export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-800 text-slate-300 ring-slate-700",
    green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    violet: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ConnectionBadge({ status }) {
  if (status === "open") return null;
  const labels = {
    connecting: "Connecting…",
    reconnecting: "Reconnecting…",
    closed: "Disconnected",
  };
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 py-1 text-center text-xs font-bold text-amber-950">
      {labels[status] || status}
    </div>
  );
}
