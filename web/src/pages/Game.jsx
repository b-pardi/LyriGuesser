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
  const [idx, setIdx] = useState(0);                      // which lyric we are on
  const [points, setPoints] = useState(0);                // score

  // last = result for the CURRENT lyric. When last is not null, we already guessed.
  // We intentionally do NOT advance idx on guess. "Next" button advances.
  const [last, setLast] = useState(null);                 // { correct, actualLabel, artist, songTitle }
  const [msg, setMsg] = useState("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const current = pool[idx] || null;

  // "done" means there is no current lyric (idx is past end)
  const done = idx >= pool.length;

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

    setPool(shuffle(out.lyrics || []));

    if ((out.lyrics || []).length === 0) {
      setMsg("No lyrics found for those genres yet. Add some as admin.");
    }
  }

  // Prevent guessing more than once per lyric:
  const hasGuessedThisLyric = last !== null;

  function guess(guessedGenreId) {
    if (!current) return;
    if (hasGuessedThisLyric) return; // don't allow double-scoring

    const actualGenreId = current.genre.id;
    const correct = guessedGenreId === actualGenreId;

    if (correct) setPoints((p) => p + 1);

    // Store the reveal info for THIS lyric.
    // We include artist/songTitle here so it still displays even after "Next".
    setLast({
      correct,
      actualLabel: current.genre.label,
      artist: current.artist,
      songTitle: current.songTitle,
    });
  }

  function nextLyric() {
    // Only allow Next after a guess (keeps flow clean)
    if (!hasGuessedThisLyric) return;

    setLast(null);
    setIdx((i) => i + 1);
  }

  const remaining = Math.max(pool.length - idx, 0);
  const canPlay = selectedIds.length >= 2;

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

        {/* Next button: only enabled after you guess and if there IS a next */}
        <button
          onClick={nextLyric}
          disabled={!hasGuessedThisLyric || done}
          title={!hasGuessedThisLyric ? "Guess first" : ""}
        >
          Next
        </button>

        <div className="spacer" />
        <div><b>Points:</b> {points}</div>
        <div><b>Remaining:</b> {remaining}</div>
      </div>

      {msg && <p className="result">{msg}</p>}

      <div className="lyricBox">
        {done ? (
          <p><b>Out of lyrics.</b> Hit Start/Reset to reshuffle.</p>
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
              disabled={!current || done || hasGuessedThisLyric}
              onClick={() => guess(gid)}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Reveal result AFTER guess, even on last lyric */}
      {last && (
        <p className="result" style={{ marginTop: 12 }}>
          {last.correct ? "✅ Correct" : "❌ Wrong"} — it was{" "}
          <b>{last.actualLabel}</b>{" "}
          (<i>{last.artist}</i> — <i>{last.songTitle}</i>)
        </p>
      )}

      {/* Helpful hint when user is at final lyric and has guessed */}
      {last && !done && idx === pool.length - 1 && (
        <p className="muted" style={{ marginTop: 8 }}>
          That was the last lyric — click <b>Next</b> to finish the round.
        </p>
      )}
    </div>
  );
}
