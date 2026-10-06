"use client";
import { useState } from "react";
import { SignOut } from "./signout";
export function LoginPanel({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function signIn() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/admin/auth/google", { method: "POST" });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw Error("unavailable");
      window.location.assign(data.url);
    } catch { setError(true); setBusy(false); }
  }
  return <div className="admin-stack">
    <button className="admin-button" disabled={!configured || busy} onClick={() => void signIn()}>{busy ? "Opening Google…" : "Continue with Google"}</button>
    {error && <p role="alert">Sign in is unavailable. Try again later.</p>}
    {configured && <SignOut />}
  </div>;
}
