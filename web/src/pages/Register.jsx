/**
 * Register.jsx
 *
 * Creates an account and triggers email verification token creation.
 * In dev, backend returns verifyUrl too (so you aren't blocked by SMTP).
 */

import React, { useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setVerifyUrl("");

    try {
      const out = await api("/api/auth/register", {
        method: "POST",
        body: { email, password: pw },
      });

      setMsg("Registered. Now verify your email.");
      // dev convenience: backend returns verifyUrl so you can click it even without SMTP
      if (out.verifyUrl) setVerifyUrl(out.verifyUrl);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Register</h2>

      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={{ marginTop: 10 }}>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />

        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit">Create account</button>
          <Link className="muted" to="/login">Already have one?</Link>
        </div>
      </form>

      {msg && <p className="result">{msg}</p>}

      {verifyUrl && (
        <p className="result">
          Dev shortcut: <a href={verifyUrl}>Click here to verify</a>
        </p>
      )}
    </div>
  );
}
