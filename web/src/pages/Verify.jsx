/**
 * Verify.jsx
 *
 * This page reads ?email=...&token=...
 * Then calls backend to verify.
 */

import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useLocation, Link } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Verify() {
  const q = useQuery();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const email = q.get("email");
    const token = q.get("token");

    if (!email || !token) {
      setStatus("Missing email or token in URL.");
      return;
    }

    api("/api/auth/verify", {
      method: "POST",
      body: { email, token },
    })
      .then(() => setStatus("✅ Verified! You can now log in."))
      .catch((err) => setStatus(`❌ ${err.message}`));
  }, []);

  return (
    <div className="card">
      <h2>Verify Email</h2>
      <p>{status}</p>
      <p style={{ marginTop: 12 }}>
        <Link to="/login">Go to login</Link>
      </p>
    </div>
  );
}
