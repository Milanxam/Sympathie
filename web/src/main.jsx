import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyTheme } from "./theme.js";
import "./index.css";

applyTheme();

// NOTE: We intentionally do NOT wrap in <React.StrictMode>. In dev, StrictMode
// double-invokes effects (mount → unmount → mount), which opens a throwaway
// WebSocket that briefly registers as host before being torn down — corrupting
// the room's hostId and duplicating players. The server also self-heals the
// host (see room.go), but skipping the dev double-connect keeps things clean.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
