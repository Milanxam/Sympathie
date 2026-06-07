import { useState } from "react";
import Home from "./screens/Home.jsx";
import Game from "./Game.jsx";

const STORAGE_KEY = "sympathie.session";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Read a ?join=CODE deep link (from a scanned QR). Returns a normalized 4-digit
// code or "". The param is stripped from the URL so a refresh stays clean.
function readJoinParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("join") || "").replace(/\D/g, "").slice(0, 4);
    if (raw) {
      params.delete("join");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "")
      );
    }
    return raw;
  } catch {
    return "";
  }
}

// App holds the {code, name} session. Until one exists we show Home; after that
// we mount Game, which owns the websocket and renders by phase.
export default function App() {
  const [session, setSession] = useState(loadSession);
  const [initialCode] = useState(readJoinParam);

  function start(s) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }

  function leave() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  if (!session) {
    return <Home onStart={start} initialCode={initialCode} />;
  }
  return (
    <Game
      key={session.code + session.name}
      code={session.code}
      name={session.name}
      onLeave={leave}
    />
  );
}
