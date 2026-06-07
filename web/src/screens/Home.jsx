import { useState } from "react";
import { ArrowRight, Plus, LogIn } from "lucide-react";
import { Screen, Brand, Button } from "../components/ui.jsx";

function randomCode() {
  // 4-digit numeric code, e.g. "0427".
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += Math.floor(Math.random() * 10);
  }
  return out;
}

// Home lets a player host a new room (generating a 4-letter code) or join an
// existing one. On submit it hands a {code, name} session up to App.
export default function Home({ onStart, initialCode = "" }) {
  // If we arrived via a scanned QR (?join=CODE), jump straight into join mode
  // with the code pre-filled.
  const [mode, setMode] = useState(initialCode ? "join" : null); // null | "host" | "join"
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

  return (
    <Screen>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Brand />
          <p className="max-w-xs text-balance text-slate-400">
            A party game about thinking like the group. Rank the cards, match the
            consensus, be <span className="font-semibold text-violet-300">kindred</span>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-300">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Sam"
              className="w-full rounded-2xl bg-slate-800 px-4 py-4 text-lg font-semibold text-slate-100 outline-none ring-1 ring-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500"
            />
          </label>

          {mode !== "join" && (
            <Button onClick={handleHost} disabled={!trimmedName}>
              <Plus className="h-5 w-5" /> Host Game
            </Button>
          )}

          {mode === "join" ? (
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-300">
                  Room code
                </span>
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="0000"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-2xl bg-slate-800 px-4 py-4 text-center text-3xl font-black tracking-[0.4em] text-slate-100 outline-none ring-1 ring-slate-700 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <Button
                onClick={handleJoin}
                disabled={!trimmedName || code.trim().length !== 4}
              >
                Join Room <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)}>
                Back
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setMode("join")}>
              <LogIn className="h-5 w-5" /> Join Game
            </Button>
          )}
        </div>
      </div>
    </Screen>
  );
}
