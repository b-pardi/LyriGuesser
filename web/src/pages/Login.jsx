/**
 * Login.jsx
 *
 * Calls backend, stores JWT token in localStorage, redirects to /add
 */

import React, { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    try {
      const out = await api("/api/auth/login", {
        method: "POST",
        body: { email, password: pw },
      });

      setToken(out.token);
      nav("/add");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>

      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={{ marginTop: 10 }}>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />

        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
          <Link className="muted" to="/register">Need an account?</Link>
        </div>
      </form>

      {msg && <p className="result">{msg}</p>}
    </div>
  );
}
