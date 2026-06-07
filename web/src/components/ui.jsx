import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { resolveSrc } from "../net.js";

// Shared input styling — always uses CSS theme variables.
export const inputClass =
  "w-full rounded-2xl bg-surface-muted px-4 py-4 text-lg font-semibold text-primary outline-none ring-1 ring-border placeholder:text-faint focus:ring-2 focus:ring-[var(--color-accent)]";

// ---- Screen scaffold -------------------------------------------------------

/** Full-height screen. Pass `footer` for a sticky bottom bar (mobile CTAs). */
export function Screen({ children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col bg-page text-primary">
      <div className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 min-h-0">
        {children}
      </div>
      {footer && (
        <div className="safe-bottom sticky bottom-0 z-10 border-t border-theme bg-page px-4 py-3 shadow-theme">
          <div className="mx-auto w-full max-w-md">{footer}</div>
        </div>
      )}
    </div>
  );
}

export function Brand({ small }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={small ? "text-2xl" : "text-5xl"} aria-hidden>
        🤝
      </span>
      <h1
        className={
          (small ? "text-2xl" : "text-4xl") +
          " font-black tracking-tight text-accent"
        }
      >
        Sympathie
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
    "inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";
  const variants = {
    primary:
      "bg-accent text-on-accent shadow-md hover:bg-[var(--color-accent-hover)]",
    secondary:
      "bg-surface-muted text-primary ring-1 ring-border hover:bg-[var(--color-border)]",
    ghost: "bg-transparent text-soft hover:bg-surface-muted",
    danger:
      "bg-[var(--color-danger)] text-on-dark hover:opacity-90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ---- Player avatar ---------------------------------------------------------

const AVATAR_COUNT = 8;

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function Avatar({ name, id, size = "md" }) {
  const color = `var(--color-avatar-${hashString(id || name || "?") % AVATAR_COUNT})`;
  const sizes = {
    sm: "h-9 w-9 text-xs",
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
      style={{ backgroundColor: color }}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-on-dark ${sizes[size]}`}
    >
      {initials || "?"}
    </div>
  );
}

// ---- Card faces ------------------------------------------------------------

export function CardFace({ card, rank, compact, onZoom }) {
  if (!card) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-surface-muted p-3 text-faint">
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
          " shrink-0 rounded-xl object-cover ring-1 ring-border"
        }
      />
    ) : (
      <span className={compact ? "text-3xl" : "text-4xl"}>{card.emoji}</span>
    );
  return (
    <div className="flex items-center gap-3">
      {rank != null && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
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
        <span className="truncate text-base font-semibold text-primary">
          {card.label}
        </span>
      )}
    </div>
  );
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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

export function Lightbox({ card, onClose }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-overlay p-5"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex min-h-11 items-center gap-1 rounded-full bg-page px-4 py-2 text-sm font-bold text-primary"
          >
            <X className="h-5 w-5" /> Schließen
          </button>
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.85 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm items-center justify-center overflow-hidden rounded-3xl bg-surface-muted"
          >
            {card.type === "image" ? (
              <ZoomableImage src={resolveSrc(card.src)} alt={card.label || ""} />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 bg-surface-muted">
                <span className="text-8xl">{card.emoji}</span>
                {card.label && (
                  <span className="text-2xl font-bold text-primary">
                    {card.label}
                  </span>
                )}
              </div>
            )}
          </motion.div>
          {card.label && card.type === "image" && (
            <p className="mt-3 text-base font-semibold text-on-dark">
              {card.label}
            </p>
          )}
          <p className="mt-2 text-sm text-on-dark opacity-80">
            {card.type === "image"
              ? "Zum Zoomen ziehen · Doppeltippen zum Zurücksetzen · außen tippen zum Schließen"
              : "Irgendwo tippen zum Schließen"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Misc ------------------------------------------------------------------

export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-surface-muted text-soft ring-border",
    green: "bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-success ring-[color-mix(in_srgb,var(--color-success)_30%,transparent)]",
    violet:
      "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-accent ring-[color-mix(in_srgb,var(--color-accent)_30%,transparent)]",
    amber:
      "bg-[color-mix(in_srgb,var(--color-warning)_15%,transparent)] text-[var(--color-warning)] ring-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]",
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
    connecting: "Verbinde…",
    reconnecting: "Verbinde neu…",
    closed: "Getrennt",
  };
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-accent py-1.5 text-center text-xs font-bold text-on-accent">
      {labels[status] || status}
    </div>
  );
}
