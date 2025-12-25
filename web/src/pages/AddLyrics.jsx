/**
 * AddLyrics.jsx
 *
 * Lets a logged-in user:
 * - add PERSONAL lyrics (always allowed when logged in)
 * - add GLOBAL lyrics (will fail unless your token says role=ADMIN)
 *
 * Note: The backend is the real enforcer. The UI just offers the buttons.
 */

import React, { useEffect, useState } from "react";
import { api, getToken } from "../api";

export default function AddLyrics() {
  const authed = Boolean(getToken());

  const [genres, setGenres] = useState([]);
  const [text, setText] = useState("");
  const [genreId, setGenreId] = useState("");
  const [msg, setMsg] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");

  useEffect(() => {
    api("/api/genres")
      .then((out) => {
        setGenres(out.genres || []);
        // default select first genre
        if ((out.genres || []).length > 0) setGenreId(out.genres[0].id);
      })
      .catch((err) => setMsg(err.message));
  }, []);

  async function addPersonal(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/lyrics/mine", {
        method: "POST",
        auth: true,
        body: {
          text,
          genreId,
          songTitle,
          artist,
        },
      });
      setMsg("✅ Added to your personal pool.");
      setText("");
      setSongTitle("");
      setArtist("");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  }

  async function addGlobal(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/lyrics/global", {
        method: "POST",
        auth: true,
        body: {
          text,
          genreId,
          songTitle,
          artist,
        },
      });
      setMsg("✅ Added to GLOBAL pool.");
      setText("");
      setSongTitle("");
      setArtist("");
    } catch (err) {
      setMsg(`❌ ${err.message} (You probably aren't ADMIN yet)`);
    }
  }

  if (!authed) {
    return (
      <div className="card">
        <h2>Add Lyrics</h2>
        <p>You must log in to add lyrics.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Add Lyrics</h2>

      <form>
        <label>Song title</label>
        <input
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
        />

        <label style={{ marginTop: 10 }}>Artist</label>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />

        <label>Lyric text</label>
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />

        <label style={{ marginTop: 10 }}>Genre</label>
        <select value={genreId} onChange={(e) => setGenreId(e.target.value)}>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>

        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={addPersonal} disabled={!genreId || !text.trim()}>Add Personal</button>
          <button onClick={addGlobal} disabled={!genreId || !text.trim()}>Add Global (Admin)</button>
        </div>
      </form>

      {msg && <p className="result">{msg}</p>}
    </div>
  );
}
