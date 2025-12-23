/**
 * App.jsx
 *
 * This file sets up:
 * - A top nav
 * - The routes (pages)
 *
 * Pages:
 * - /         -> Game (global pool, no account required)
 * - /register -> Create account
 * - /verify   -> Verify email (token from link)
 * - /login    -> Log in
 * - /add      -> Add lyrics (personal; plus global if you are admin)
 */

import React from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import { getToken, setToken } from "./api";

import Game from "./pages/Game.jsx";
import Register from "./pages/Register.jsx";
import Verify from "./pages/Verify.jsx";
import Login from "./pages/Login.jsx";
import AddLyrics from "./pages/AddLyrics.jsx";

export default function App() {
  const nav = useNavigate();
  const authed = Boolean(getToken());

  function logout() {
    setToken(null);
    nav("/");
  }

  return (
    <div className="container">
      <header className="topbar">
        <Link className="brand" to="/">LyriGuesser</Link>

        <nav className="navlinks">
          <Link to="/">Play</Link>
          <Link to="/add">Add Lyrics</Link>

          {!authed ? (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          ) : (
            <button className="linkBtn" onClick={logout}>Logout</button>
          )}
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add" element={<AddLyrics />} />
        </Routes>
      </main>
    </div>
  );
}
