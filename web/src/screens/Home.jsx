import { useState } from "react";
import { ArrowRight, Plus, LogIn } from "lucide-react";
import { Screen, Brand, Button, inputClass } from "../components/ui.jsx";

function randomCode() {
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

export default function Home({ onStart, initialCode = "" }) {
  const [mode, setMode] = useState(initialCode ? "join" : null);
  const [name, setName] = useState("");
  const [code, setCode] = useState(initialCode);

  const trimmedName = name.trim();

  function handleHost() {
    if (!trimmedName) return;
    onStart({ code: randomCode(), name: trimmedName });
  }

  function handleJoin() {
    const c = code.trim();
    if (!trimmedName || !/^[0-9]{4}$/.test(c)) return;
    onStart({ code: c, name: trimmedName });
  }

  const footer = (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-soft">
          Dein Name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Max"
          autoComplete="nickname"
          enterKeyHint="go"
          className={inputClass}
        />
      </label>

      {mode !== "join" && (
        <Button onClick={handleHost} disabled={!trimmedName}>
          <Plus className="h-5 w-5" /> Spiel hosten
        </Button>
      )}

      {mode === "join" ? (
        <>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-soft">
              Raum-Code
            </span>
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="0000"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              enterKeyHint="go"
              className={`${inputClass} text-center text-4xl font-black tracking-[0.35em]`}
            />
          </label>
          <Button
            onClick={handleJoin}
            disabled={!trimmedName || code.trim().length !== 4}
          >
            Beitreten <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="ghost" onClick={() => setMode(null)}>
            Zurück
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={() => setMode("join")}>
          <LogIn className="h-5 w-5" /> Spiel beitreten
        </Button>
      )}
    </div>
  );

  return (
    <Screen footer={footer}>
      <div className="flex flex-1 flex-col justify-center py-6 text-center">
        <Brand />
        <p className="mx-auto mt-4 max-w-xs text-balance text-base leading-relaxed text-muted">
          Das Partyspiel darüber, wie gut ihr euch kennt. Eine Person ordnet
          heimlich – die anderen erraten ihre Reihenfolge.
        </p>
        <p className="mt-2 text-sm font-semibold text-accent">
          Sei sympathisch.
        </p>
      </div>
    </Screen>
  );
}
