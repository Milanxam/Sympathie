import { useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { EMOJI_DECKS, newCardId, newId } from "../decks.js";
import { uploadImage, resolveSrc } from "../net.js";

// DeckManager is the host's lobby deck library editor. It manages a working
// copy of the decks and calls onChange(decks, activeDeckId) after every change
// so the lobby can sync the library to the server.
export default function DeckManager({ decks, activeDeckId, onChange, onZoom }) {
  const [editingId, setEditingId] = useState(null);
  const [showAddEmoji, setShowAddEmoji] = useState(false);
  const [uploading, setUploading] = useState(null); // { done, total } | null
  const fileRef = useRef(null);
  const newDeckFileRef = useRef(null);

  const editing = decks.find((d) => d.id === editingId);

  function commit(nextDecks, nextActive = activeDeckId) {
    // Keep the active deck valid.
    let active = nextActive;
    if (!nextDecks.some((d) => d.id === active)) {
      active = nextDecks[0]?.id || "";
    }
    onChange(nextDecks, active);
  }

  function addEmojiDeck(preset) {
    const deck = {
      id: newId("deck"),
      name: preset.name,
      cards: preset.cards.map((c) => ({ ...c, id: newId("c") })),
    };
    commit([...decks, deck], decks.length === 0 ? deck.id : activeDeckId);
    setShowAddEmoji(false);
  }

  // Create a whole photo deck in one go from a batch of selected images.
  async function createDeckFromPhotos(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading({ done: 0, total: files.length });
    const cards = [];
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        cards.push({ id: newCardId(), type: "image", src: url, label: "" });
      } catch {
        /* skip a failed image */
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (cards.length === 0) return;
    const deck = {
      id: newId("deck"),
      name: `Foto-Deck ${decksRef.current.length + 1}`,
      cards,
    };
    const next = [...decksRef.current, deck];
    decksRef.current = next;
    commit(next, decksRef.current.length === 1 ? deck.id : activeDeckId);
    setEditingId(deck.id);
  }

  function renameDeck(id, name) {
    commit(decks.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  function deleteDeck(id) {
    commit(decks.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function removeCard(deckId, cardId) {
    commit(
      decks.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) }
          : d
      )
    );
  }

  function setCardLabel(deckId, cardId, label) {
    commit(
      decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? { ...c, label } : c
              ),
            }
          : d
      )
    );
  }

  async function onFiles(deckId, fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading({ done: 0, total: files.length });
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        const card = { id: newCardId(), type: "image", src: url, label: "" };
        // Across awaits the `decks` closure is stale, so commit one card at a
        // time off the freshest array tracked in decksRef.
        commitAddCard(deckId, card);
      } catch {
        /* ignore a failed upload */
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
  }

  // Add a single card using the latest decks snapshot from the DOM-bound state.
  // We read from `decks` prop which the parent updates after each commit, so we
  // capture it via a setter callback.
  const decksRef = useRef(decks);
  decksRef.current = decks;
  function commitAddCard(deckId, card) {
    const latest = decksRef.current;
    const next = latest.map((d) =>
      d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
    );
    decksRef.current = next;
    commit(next);
  }

  // ---- Edit view ----------------------------------------------------------
  if (editing) {
    const isPhoto = editing.cards.every((c) => c.type === "image") || editing.cards.length === 0;
    return (
      <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
        <button
          onClick={() => setEditingId(null)}
          className="mb-3 flex items-center gap-1 text-sm font-semibold text-soft"
        >
          <ArrowLeft className="h-4 w-4" /> Fertig
        </button>
        <input
          value={editing.name}
          onChange={(e) => renameDeck(editing.id, e.target.value)}
          className="mb-3 w-full rounded-xl bg-surface-muted px-3 py-2 text-lg font-bold text-primary outline-none ring-1 ring-border focus:ring-2 focus:ring-[var(--color-accent)]"
        />

        {isPhoto && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="mb-3 flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-bold text-on-accent"
            >
              <Camera className="h-5 w-5" /> Fotos hinzufügen
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(editing.id, e.target.files);
                e.target.value = "";
              }}
            />
            {uploading && (
              <div className="mb-3 rounded-xl bg-surface-muted px-4 py-2.5 text-center text-sm font-semibold text-primary ring-1 ring-border">
                Fotos werden hochgeladen… {uploading.done}/{uploading.total}
              </div>
            )}
          </>
        )}

        <p className="mb-2 text-xs font-semibold text-muted">
          {editing.cards.length} Karten{" "}
          {editing.cards.length < 5 && (
            <span className="text-[var(--color-warning)]">· mind. 5 zum Spielen</span>
          )}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {editing.cards.map((c) => (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => onZoom?.(c)}
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-muted ring-1 ring-border"
              >
                {c.type === "image" ? (
                  <img
                    src={resolveSrc(c.src)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{c.emoji}</span>
                )}
              </button>
              <button
                onClick={() => removeCard(editing.id, c.id)}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-danger)] text-on-dark shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {c.type === "image" && (
                <input
                  value={c.label || ""}
                  onChange={(e) => setCardLabel(editing.id, c.id, e.target.value)}
                  placeholder="Bezeichnung"
                  className="mt-1 w-full rounded-md bg-surface-muted px-2 py-1 text-xs text-primary outline-none ring-1 ring-border"
                />
              )}
            </div>
          ))}
        </div>
        {editing.cards.length === 0 && (
          <p className="mt-4 text-center text-sm text-faint">
            Noch keine Karten – füge Fotos hinzu.
          </p>
        )}
      </div>
    );
  }

  // ---- List view ----------------------------------------------------------
  const usedPresetIds = new Set(decks.map((d) => d.name));
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <ImageIcon className="h-5 w-5" />
        <h2 className="text-base font-bold">Decks</h2>
        <span className="text-xs text-faint">tippen für aktives Deck</span>
      </div>

      <ul className="flex flex-col gap-2">
        {decks.map((d) => {
          const active = d.id === activeDeckId;
          return (
            <li
              key={d.id}
              onClick={() => commit(decks, d.id)}
              className={`cursor-pointer rounded-xl p-3 ring-1 ${
                    active
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] ring-[var(--color-accent)]"
                  : "bg-surface-muted ring-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    active ? "bg-accent text-on-accent" : "ring-1 ring-border"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1 truncate font-semibold text-primary">
                  {d.name}
                </span>
                <span className="text-xs text-muted">{d.cards.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(d.id);
                  }}
                  className="rounded-lg p-1.5 text-soft hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {decks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDeck(d.id);
                    }}
                    className="rounded-lg p-1.5 text-[var(--color-danger)] hover:bg-surface-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {d.cards.length > 0 && (
                <div className="mt-2 flex gap-1 overflow-hidden">
                  {d.cards.slice(0, 7).map((c) => (
                    <span
                      key={c.id}
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-page ring-1 ring-border"
                    >
                      {c.type === "image" ? (
                        <img
                          src={resolveSrc(c.src)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">{c.emoji}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {d.cards.length < 5 && (
                <p className="mt-2 text-xs text-[var(--color-warning)]">Mind. 5 Karten zum Spielen</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        <button
          onClick={() => setShowAddEmoji((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-xl bg-surface-muted py-2.5 text-sm font-bold text-primary ring-1 ring-border"
        >
          <Plus className="h-4 w-4" /> Emoji-Deck hinzufügen
        </button>
        {showAddEmoji && (
          <div className="flex flex-wrap gap-2 rounded-xl bg-surface-muted p-2 ring-1 ring-border">
            {EMOJI_DECKS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => addEmojiDeck(preset)}
                disabled={usedPresetIds.has(preset.name)}
                className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-border disabled:opacity-40"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => newDeckFileRef.current?.click()}
          disabled={!!uploading}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-on-accent disabled:opacity-50"
        >
          <Camera className="h-4 w-4" /> Foto-Deck aus Galerie
        </button>
        <input
          ref={newDeckFileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            createDeckFromPhotos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploading && (
        <div className="mt-3 rounded-xl bg-surface-muted px-4 py-3 text-center text-sm font-semibold text-primary ring-1 ring-border">
          Fotos werden hochgeladen… {uploading.done}/{uploading.total}
        </div>
      )}
    </div>
  );
}
