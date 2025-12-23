/**
 * Game.jsx
 *
 * Global-pool gameplay:
 * - Anyone can play (no account required)
 * - We fetch global lyrics once
 * - We shuffle them
 * - We walk through them in order (this is "without replacement")
 * - Reset reshuffles and resets score
 */

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

// shuffle so we do "without replacement"
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Game() {
  const [genres, setGenres] = useState([]);               // available genres
  const [selected, setSelected] = useState(new Set());    // set of genreIds selected
  const [pool, setPool] = useState([]);                   // lyrics fetched
  const [idx, setIdx] = useState(0);
  const [points, setPoints] = useState(0);
  const [last, setLast] = useState(null);                 // { correct, actualLabel }
  const [msg, setMsg] = useState("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const current = pool[idx] || null;
  const done = pool.length > 0 && idx >= pool.length;

  // Load genres on first visit
  useEffect(() => {
    api("/api/genres")
      .then((out) => {
        const gs = out.genres || [];
        setGenres(gs);

        // Default selection: first 2 genres if possible
        const s = new Set();
        if (gs[0]) s.add(gs[0].id);
        if (gs[1]) s.add(gs[1].id);
        setSelected(s);
      })
      .catch((err) => setMsg(err.message));
  }, []);

  function toggleGenre(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function startOrReset() {
    setMsg("");
    setIdx(0);
    setPoints(0);
    setLast(null);

    if (selectedIds.length < 2) {
      setPool([]);
      setMsg("Select at least 2 genres to play.");
      return;
    }

    // Request only lyrics that match selected genres
    const qp = encodeURIComponent(selectedIds.join(","));
    const out = await api(`/api/lyrics/global?genreIds=${qp}`);

    // Note: lyric.genre is now an object {id,key,label}
    setPool(shuffle(out.lyrics || []));

    if ((out.lyrics || []).length === 0) {
      setMsg("No lyrics found for those genres yet. Add some as admin.");
    }
  }

  // If selection changes, don’t auto-reset. Force explicit Start/Reset to avoid surprise.
  const canPlay = selectedIds.length >= 2;

  function guess(guessedGenreId) {
    if (!current) return;

    const actualGenreId = current.genre.id;
    const correct = guessedGenreId === actualGenreId;

    if (correct) setPoints((p) => p + 1);
    setLast({ correct, actualLabel: current.genre.label });

    setIdx((i) => i + 1);
  }

  const remaining = Math.max(pool.length - idx, 0);

  return (
    <div className="card">
      <h2>Play (Global Pool)</h2>
      <p className="muted">
        Pick which genres to include, then guess which one each lyric belongs to.
      </p>

      <div style={{ marginTop: 12 }}>
        <b>Choose genres:</b>
        <div style={{ marginTop: 8 }}>
          {genres.length === 0 ? (
            <p className="muted">No genres yet. Create some as admin.</p>
          ) : (
            genres.map((g) => (
              <label key={g.id} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggleGenre(g.id)}
                  style={{ marginRight: 8 }}
                />
                {g.label}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={() => startOrReset().catch((e) => setMsg(e.message))} disabled={!canPlay}>
          Start / Reset
        </button>
        <div className="spacer" />
        <div><b>Points:</b> {points}</div>
        <div><b>Remaining:</b> {remaining}</div>
      </div>

      {msg && <p className="result">{msg}</p>}

      <div className="lyricBox">
        {done ? (
          <p><b>Out of lyrics.</b> Hit Start/Reset.</p>
        ) : current ? (
          <p className="lyricText">“{current.text}”</p>
        ) : (
          <p className="muted">Click Start/Reset to load a shuffled set.</p>
        )}
      </div>

      {/* Guess buttons: one per selected genre */}
      <div className="row">
        {selectedIds.map((gid) => {
          const g = genres.find((x) => x.id === gid);
          if (!g) return null;
          return (
            <button
              key={gid}
              disabled={!current || done}
              onClick={() => guess(gid)}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {last && (
        <p className="result">
          {last.correct ? "✅ Correct" : "❌ Wrong"} — it was <b>{last.actualLabel}</b>
        </p>
      )}
    </div>
  );
}
