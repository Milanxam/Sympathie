import { toTailwindColors } from "./src/theme.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // All colors come from src/theme.js — edit that file to retheme the app.
      colors: toTailwindColors(),
    },
  },
  plugins: [],
};
