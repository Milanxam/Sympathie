import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion } from "framer-motion";

// JoinQR shows a small QR encoding the room's join URL. Tapping it opens a large
// version that's easy for others to scan across a table. Scanning opens the app
// with ?join=<code> pre-filled (see App.jsx).
export default function JoinQR({ url, code }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 flex flex-col items-center gap-2"
      >
        <span className="rounded-2xl bg-white p-2.5">
          <QRCodeSVG value={url} size={128} level="M" />
        </span>
        <span className="text-xs font-semibold text-slate-400">
          Scan to join · tap to enlarge
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-300">
              Scan to join
            </p>
            <div className="rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
              <QRCodeSVG value={url} size={256} level="M" />
            </div>
            <p className="text-5xl font-black tracking-[0.3em] text-violet-300">
              {code}
            </p>
            <p className="text-sm text-slate-400">Tap anywhere to close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
