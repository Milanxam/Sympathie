/**
 * SYMPATHIE — COLOR TEMPLATE
 * ==========================
 * Change the look of the whole app by editing ONE place:
 *
 *   1. Pick a preset below (or duplicate one and tweak the hex values)
 *   2. Set `activeTheme` to that preset's name
 *   3. Save — Tailwind classes, CSS variables, QR codes, charts, and avatars
 *      all follow automatically.
 *
 * Optional: update `web/index.html` <meta name="theme-color"> to match
 * `palette.bg` (used before JS loads on mobile browsers).
 */

// ---------------------------------------------------------------------------
// Presets — copy a block, rename it, tweak hex values, set `activeTheme`.
// ---------------------------------------------------------------------------

export const presets = {
  /** Current earthy palette (cream / sage / caramel) */
  earthy: {
    mode: "light",
    bg: "#FEF9E1",
    surface: "#FAEDCD",
    surfaceMuted: "#E9EDCA",
    border: "#CDD5AE",
    text: "#43382C",
    textSoft: "#5E5040",
    textMuted: "#8A7C68",
    textFaint: "#9C8D77",
    accent: "#D3A373",
    accentHover: "#A9764A",
    accentSoft: "#CDAB84",
    accentText: "#A9764A",
    accentDark: "#8A6F47",
    olive: "#7F8A4F",
    success: "#6F8F4F",
    successSoft: "#7F9A52",
    warning: "#C08A3C",
    danger: "#C0613F",
    dangerHover: "#B15334",
    shadow: "#3A2F24",
    onAccent: "#43382C", // text on caramel buttons
    onDark: "#FEF9E1", // text on dark overlays (QR modal)
    overlay: "rgba(67, 56, 44, 0.88)", // lightbox / QR backdrop
    chart: ["#D3A373", "#7F8A4F", "#A9764A", "#6F8F4F", "#C0613F", "#8A6F47"],
    avatar: [
      "#A9764A",
      "#7F8A4F",
      "#8A6F47",
      "#C0613F",
      "#6F8F4F",
      "#9C7B4A",
      "#5E7A53",
      "#B5803F",
    ],
  },

  /** Example: cool ocean — uncomment `activeTheme` below to try it */
  ocean: {
    mode: "light",
    bg: "#E8F4F8",
    surface: "#D4EAF2",
    surfaceMuted: "#C5E3ED",
    border: "#9EC9DC",
    text: "#1A3A4A",
    textSoft: "#2A4F62",
    textMuted: "#5A7F92",
    textFaint: "#7A9FB0",
    accent: "#3B9BBF",
    accentHover: "#2E7E9C",
    accentSoft: "#6BB8D4",
    accentText: "#2E7E9C",
    accentDark: "#1F5F78",
    olive: "#4A8F6F",
    success: "#3D9B6E",
    successSoft: "#52B080",
    warning: "#E0A030",
    danger: "#D45A45",
    dangerHover: "#B84A38",
    shadow: "#0F2A36",
    onAccent: "#FFFFFF",
    onDark: "#E8F4F8",
    overlay: "rgba(26, 58, 74, 0.88)",
    chart: ["#3B9BBF", "#4A8F6F", "#2E7E9C", "#3D9B6E", "#D45A45", "#1F5F78"],
    avatar: [
      "#3B9BBF",
      "#4A8F6F",
      "#2E7E9C",
      "#3D9B6E",
      "#1F5F78",
      "#6BB8D4",
      "#52B080",
      "#D45A45",
    ],
  },

  /** Example: dark lounge */
  midnight: {
    mode: "dark",
    bg: "#1A1625",
    surface: "#252033",
    surfaceMuted: "#2E2840",
    border: "#3D3555",
    text: "#F0EBF5",
    textSoft: "#D8D0E5",
    textMuted: "#9A8FB0",
    textFaint: "#7A6F95",
    accent: "#9B7FD4",
    accentHover: "#B49AE8",
    accentSoft: "#7A63B0",
    accentText: "#C4AEFF",
    accentDark: "#6B52A0",
    olive: "#6BAF7F",
    success: "#5CB87A",
    successSoft: "#72D090",
    warning: "#E8B84A",
    danger: "#E06B6B",
    dangerHover: "#C85555",
    shadow: "#0D0A14",
    onAccent: "#1A1625",
    onDark: "#F0EBF5",
    overlay: "rgba(13, 10, 20, 0.92)",
    chart: ["#9B7FD4", "#6BAF7F", "#B49AE8", "#5CB87A", "#E06B6B", "#6B52A0"],
    avatar: [
      "#9B7FD4",
      "#6BAF7F",
      "#B49AE8",
      "#5CB87A",
      "#6B52A0",
      "#E8B84A",
      "#E06B6B",
      "#7A63B0",
    ],
  },
};

// ---------------------------------------------------------------------------
// Active theme — change this one line to switch presets
// ---------------------------------------------------------------------------

export const activeTheme = "earthy";

export const palette = presets[activeTheme] ?? presets.earthy;

// ---------------------------------------------------------------------------
// CSS custom properties (used by index.css + runtime meta tag)
// ---------------------------------------------------------------------------

export function cssVariables(p = palette) {
  const vars = {
    "--color-bg": p.bg,
    "--color-surface": p.surface,
    "--color-surface-muted": p.surfaceMuted,
    "--color-border": p.border,
    "--color-text": p.text,
    "--color-text-soft": p.textSoft,
    "--color-text-muted": p.textMuted,
    "--color-text-faint": p.textFaint,
    "--color-accent": p.accent,
    "--color-accent-hover": p.accentHover,
    "--color-accent-text": p.accentText,
    "--color-accent-soft": p.accentSoft,
    "--color-accent-dark": p.accentDark,
    "--color-olive": p.olive,
    "--color-success": p.success,
    "--color-success-soft": p.successSoft,
    "--color-warning": p.warning,
    "--color-danger": p.danger,
    "--color-danger-hover": p.dangerHover,
    "--color-on-accent": p.onAccent,
    "--color-on-dark": p.onDark,
    "--color-overlay": p.overlay,
    "--color-shadow": p.shadow,
  };
  (p.chart || []).forEach((color, i) => {
    vars[`--color-chart-${i}`] = color;
  });
  (p.avatar || []).forEach((color, i) => {
    vars[`--color-avatar-${i}`] = color;
  });
  return vars;
}

/** Read a resolved CSS custom property (for SVG/canvas APIs that need hex). */
export function getCssColor(name) {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Call once at startup — sets CSS vars + mobile theme-color meta tag. */
export function applyTheme(p = palette) {
  const root = document.documentElement;
  Object.entries(cssVariables(p)).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", p.bg);
}

// ---------------------------------------------------------------------------
// Tailwind color map — every utility points at CSS variables so runtime
// applyTheme() updates the whole app (not just semantic utility classes).
// ---------------------------------------------------------------------------

const c = {
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceMuted: "var(--color-surface-muted)",
  border: "var(--color-border)",
  text: "var(--color-text)",
  textSoft: "var(--color-text-soft)",
  textMuted: "var(--color-text-muted)",
  textFaint: "var(--color-text-faint)",
  accent: "var(--color-accent)",
  accentSoft: "var(--color-accent-soft)",
  accentText: "var(--color-accent-text)",
  accentDark: "var(--color-accent-dark)",
  success: "var(--color-success)",
  successSoft: "var(--color-success-soft)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  dangerHover: "var(--color-danger-hover)",
  shadow: "var(--color-shadow)",
  olive: "var(--color-olive)",
};

export function toTailwindColors() {
  return {
    cream: c.bg,
    tan: c.surface,
    sand: c.surfaceMuted,
    sage: c.border,
    caramel: c.accent,
    clay: c.accentText,
    olive: c.olive,
    ink: c.text,

    // Slate scale: high numbers = backgrounds, low numbers = text.
    slate: {
      100: c.text,
      200: c.textSoft,
      300: c.textSoft,
      400: c.textMuted,
      500: c.textFaint,
      600: c.border,
      700: c.border,
      800: c.surfaceMuted,
      900: c.surface,
      950: c.bg,
    },
    violet: {
      200: c.accentDark,
      300: c.accentText,
      400: c.border,
      500: c.accent,
      600: c.accentSoft,
      900: c.shadow,
    },
    fuchsia: {
      400: c.accent,
      500: c.accent,
      600: c.accentSoft,
    },
    emerald: {
      300: c.success,
      400: c.success,
      500: c.successSoft,
    },
    amber: {
      200: c.accentText,
      300: c.accentText,
      400: c.warning,
      500: c.accent,
      950: c.text,
    },
    rose: {
      400: c.dangerHover,
      500: c.danger,
      600: c.dangerHover,
    },
    indigo: {
      500: c.accentDark,
    },
  };
}
