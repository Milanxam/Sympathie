// Networking helpers. Everything the app needs to know about *where* the
// backend lives is centralized here.
//
// - In dev (`vite`), the websocket connects straight to ws://localhost:8080/ws
//   and /upload is proxied (see vite.config.js).
// - In a same-origin production build (served by the Go binary behind Caddy),
//   the websocket uses wss://<host>/ws and /upload is a relative URL.
//
// You can override the backend explicitly with VITE_WS_BASE (e.g.
// "wss://kindred.example.com").

const WS_BASE = import.meta.env.VITE_WS_BASE;

export function wsUrl(code, name) {
  let base = WS_BASE;
  if (!base) {
    if (import.meta.env.DEV) {
      base = "ws://localhost:8080";
    } else {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      base = `${proto}://${window.location.host}`;
    }
  }
  const params = new URLSearchParams({ code, name });
  return `${base}/ws?${params.toString()}`;
}

// downscaleImage shrinks a (possibly huge) phone photo to at most `max` px on
// its longest side and re-encodes as JPEG. This makes uploads fast on mobile
// data and respects EXIF orientation so iOS photos aren't rotated. Falls back
// to the original file if anything goes wrong.
export async function downscaleImage(file, max = 1024, quality = 0.8) {
  if (!file || !file.type?.startsWith("image/")) return file;
  // GIFs would lose animation; keep them as-is.
  if (file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    let { width, height } = bitmap;
    if (width > height && width > max) {
      height = Math.round((height * max) / width);
      width = max;
    } else if (height > max) {
      width = Math.round((width * max) / height);
      height = max;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Upload a single image File to the backend, returning the public URL. The
// image is downscaled client-side first.
export async function uploadImage(file) {
  const optimized = await downscaleImage(file);
  const form = new FormData();
  form.append("file", optimized);
  const base = import.meta.env.VITE_HTTP_BASE || "";
  const res = await fetch(`${base}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url;
}

// joinUrl builds the shareable URL that a QR code encodes. Scanning it opens
// this same site with the code pre-filled. Uses the current origin so it works
// on localhost, LAN, or the deployed Vercel domain automatically.
export function joinUrl(code) {
  return `${window.location.origin}/?join=${encodeURIComponent(code)}`;
}

// Resolve a card image src (which the server stores as /uploads/...) into a URL
// the browser can actually load, accounting for an explicit HTTP base.
export function resolveSrc(src) {
  if (!src) return src;
  if (/^https?:\/\//.test(src)) return src;
  const base = import.meta.env.VITE_HTTP_BASE || "";
  return `${base}${src}`;
}
