import { useCallback, useEffect, useRef, useState } from "react";
import { wsUrl } from "./net.js";

// useGame owns the single WebSocket connection for a session and exposes the
// latest server state plus typed senders. The UI is a pure function of `state`
// and `myId`; this hook never computes scores or consensus.
//
// Connection states: "connecting" | "open" | "reconnecting" | "closed".
export function useGame(code, name) {
  const [state, setState] = useState(null);
  const [myId, setMyId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [status, setStatus] = useState("connecting");

  const wsRef = useRef(null);
  const attemptRef = useRef(0);
  const closedRef = useRef(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!code || !name) return;
    closedRef.current = false;

    const ws = new WebSocket(wsUrl(code, name));
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setStatus("open");
      ws.send(JSON.stringify({ type: "join", name }));
    };

    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "hello") {
        setMyId(msg.you);
        setHostId(msg.hostId);
      } else if (msg.type === "state") {
        setState(msg.state);
      }
    };

    ws.onclose = () => {
      if (closedRef.current) return;
      // Exponential backoff capped at 5s, with a little jitter.
      const attempt = attemptRef.current++;
      const delay = Math.min(5000, 500 * 2 ** attempt) + Math.random() * 250;
      setStatus("reconnecting");
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose handles the retry; just make sure the socket is torn down.
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }, [code, name]);

  useEffect(() => {
    connect();
    return () => {
      closedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* noop */
        }
      }
    };
  }, [connect]);

  const send = useCallback((obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }, []);

  const startRound = useCallback(
    (prompt, cards) => send({ type: "startRound", prompt, cards }),
    [send]
  );
  const lockIn = useCallback((order) => send({ type: "lockIn", order }), [send]);
  const nextRound = useCallback(() => send({ type: "nextRound" }), [send]);
  const endGame = useCallback(() => send({ type: "endGame" }), [send]);
  const setDecks = useCallback(
    (decks, deckId) => send({ type: "setDecks", decks, deckId }),
    [send]
  );

  // state.hostId is authoritative once we have a snapshot; fall back to the
  // hostId from the initial hello until then.
  const effectiveHostId = state?.hostId ?? hostId;
  const isHost = myId != null && effectiveHostId != null && myId === effectiveHostId;

  // The ranker is whose secret order everyone else guesses this round.
  const rankerId = state?.rankerId ?? null;
  const isRanker = myId != null && rankerId != null && myId === rankerId;

  return {
    state,
    myId,
    hostId,
    isHost,
    rankerId,
    isRanker,
    status,
    startRound,
    lockIn,
    nextRound,
    endGame,
    setDecks,
  };
}
