import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local dev we proxy /upload and /uploads to the Go server on :8080 so
// the frontend can use same-origin relative URLs. The websocket connects to
// ws://localhost:8080/ws directly (see src/net.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/upload": "http://localhost:8080",
      "/uploads": "http://localhost:8080",
    },
  },
});
