import { useGame } from "./useGame.js";
import { Screen, Brand, ConnectionBadge } from "./components/ui.jsx";
import Lobby from "./screens/Lobby.jsx";
import PromptScreen from "./screens/PromptScreen.jsx";
import Ranking from "./screens/Ranking.jsx";
import Reveal from "./screens/Reveal.jsx";
import GameOver from "./screens/GameOver.jsx";

// Game owns the websocket session and renders the screen for the current phase.
// Every screen is a pure function of `state` + `myId`.
export default function Game({ code, name, onLeave }) {
  const game = useGame(code, name);
  const { state, status } = game;

  if (!state) {
    return (
      <>
        <ConnectionBadge status={status} />
        <Screen>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Brand />
            <p className="animate-pulse text-muted">Trete Raum {code} bei…</p>
          </div>
        </Screen>
      </>
    );
  }

  const shared = { ...game, code, onLeave };

  let screen;
  switch (state.phase) {
    case "lobby":
      screen = <Lobby {...shared} />;
      break;
    case "prompt":
      screen = <PromptScreen {...shared} />;
      break;
    case "ranking":
      screen = <Ranking {...shared} />;
      break;
    case "reveal":
      screen = <Reveal {...shared} />;
      break;
    case "gameOver":
      screen = <GameOver {...shared} />;
      break;
    default:
      screen = <Lobby {...shared} />;
  }

  return (
    <>
      <ConnectionBadge status={status} />
      {screen}
    </>
  );
}
