import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";
import { getCssColor } from "../theme.js";

// JoinQR shows a small QR encoding the room's join URL. Tapping it opens a large
// version that's easy for others to scan across a table. Scanning opens the app
// with ?join=<code> pre-filled (see App.jsx).
export default function JoinQR({ url, code }) {
  const [open, setOpen] = useState(false);
  const [qrColors, setQrColors] = useState({ bg: "", fg: "" });

  useEffect(() => {
    setQrColors({
      bg: getCssColor("--color-bg"),
      fg: getCssColor("--color-text"),
    });
  }, []);

  const qrProps =
    qrColors.bg && qrColors.fg
      ? { bgColor: qrColors.bg, fgColor: qrColors.fg }
      : {};

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 flex flex-col items-center gap-2"
      >
        <span className="rounded-2xl bg-page p-2.5 ring-1 ring-border">
          <QRCodeSVG value={url} size={112} level="M" {...qrProps} />
        </span>
        <span className="text-xs font-semibold text-muted">
          Zum Beitreten scannen · zum Vergrößern tippen
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-overlay p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-on-dark">
              Zum Beitreten scannen
            </p>
            <div
              className="rounded-3xl bg-page p-5 ring-1 ring-border"
              onClick={(e) => e.stopPropagation()}
            >
              <QRCodeSVG value={url} size={240} level="M" {...qrProps} />
            </div>
            <p className="text-5xl font-black tracking-[0.3em] text-on-dark">
              {code}
            </p>
            <p className="text-sm text-on-dark opacity-80">Irgendwo tippen zum Schließen</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
