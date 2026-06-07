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
      name: `Photo deck ${decksRef.current.length + 1}`,
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
      <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
        <button
          onClick={() => setEditingId(null)}
          className="mb-3 flex items-center gap-1 text-sm font-semibold text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" /> Done
        </button>
        <input
          value={editing.name}
          onChange={(e) => renameDeck(editing.id, e.target.value)}
          className="mb-3 w-full rounded-xl bg-slate-800 px-3 py-2 text-lg font-bold text-white outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-violet-500"
        />

        {isPhoto && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 font-bold text-white"
            >
              <Camera className="h-5 w-5" /> Add photos
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
              <div className="mb-3 rounded-xl bg-slate-800 px-4 py-2.5 text-center text-sm font-semibold text-slate-200 ring-1 ring-slate-700">
                Uploading photos… {uploading.done}/{uploading.total}
              </div>
            )}
          </>
        )}

        <p className="mb-2 text-xs font-semibold text-slate-400">
          {editing.cards.length} cards{" "}
          {editing.cards.length < 5 && (
            <span className="text-amber-400">· need 5+ to play</span>
          )}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {editing.cards.map((c) => (
            <div key={c.id} className="relative">
              <button
                type="button"
                onClick={() => onZoom?.(c)}
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-700"
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
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {c.type === "image" && (
                <input
                  value={c.label || ""}
                  onChange={(e) => setCardLabel(editing.id, c.id, e.target.value)}
                  placeholder="Label"
                  className="mt-1 w-full rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none ring-1 ring-slate-700"
                />
              )}
            </div>
          ))}
        </div>
        {editing.cards.length === 0 && (
          <p className="mt-4 text-center text-sm text-slate-500">
            No cards yet — add some photos.
          </p>
        )}
      </div>
    );
  }

  // ---- List view ----------------------------------------------------------
  const usedPresetIds = new Set(decks.map((d) => d.name));
  return (
    <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
      <div className="mb-3 flex items-center gap-2 text-slate-200">
        <ImageIcon className="h-5 w-5" />
        <h2 className="text-base font-bold">Decks</h2>
        <span className="text-xs text-slate-500">tap to set the active deck</span>
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
                  ? "bg-violet-500/20 ring-violet-400"
                  : "bg-slate-800 ring-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    active ? "bg-violet-400 text-slate-900" : "ring-1 ring-slate-600"
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="flex-1 truncate font-semibold text-white">
                  {d.name}
                </span>
                <span className="text-xs text-slate-400">{d.cards.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(d.id);
                  }}
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {decks.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDeck(d.id);
                    }}
                    className="rounded-lg p-1.5 text-rose-400 hover:bg-slate-700"
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
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-900 ring-1 ring-slate-700"
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
                <p className="mt-2 text-xs text-amber-400">Needs 5+ cards to play</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-col gap-2">
        <button
          onClick={() => setShowAddEmoji((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-slate-200 ring-1 ring-slate-700"
        >
          <Plus className="h-4 w-4" /> Add emoji deck
        </button>
        {showAddEmoji && (
          <div className="flex flex-wrap gap-2 rounded-xl bg-slate-800 p-2 ring-1 ring-slate-700">
            {EMOJI_DECKS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => addEmojiDeck(preset)}
                disabled={usedPresetIds.has(preset.name)}
                className="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-40"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => newDeckFileRef.current?.click()}
          disabled={!!uploading}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Camera className="h-4 w-4" /> Photo deck from camera roll
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
        <div className="mt-3 rounded-xl bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-slate-200 ring-1 ring-slate-700">
          Uploading photos… {uploading.done}/{uploading.total}
        </div>
      )}
    </div>
  );
}
