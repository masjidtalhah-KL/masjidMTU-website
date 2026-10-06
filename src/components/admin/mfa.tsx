"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/browser";
import type { BrowserConfig } from "@/lib/supabase/config";
export function MfaPanel({ config, userId, next }: { config: BrowserConfig; userId: string; next: string }) {
  const sensitive = useRef<HTMLElement>(null);
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const hide = () => { if (sensitive.current) sensitive.current.hidden = true; };
    const leave = () => { hide(); setEnrollment(null); setCode(""); window.location.replace("/admin/login?state=denied"); };
    const { data } = browserClient(config).auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || session && session.user.id !== userId) leave();
    });
    const show = (event: PageTransitionEvent) => { if (event.persisted) { hide(); window.location.reload(); } };
    window.addEventListener("pagehide", hide); window.addEventListener("pageshow", show);
    return () => { data.subscription.unsubscribe(); window.removeEventListener("pagehide", hide); window.removeEventListener("pageshow", show); };
  }, [config, userId]);
  useEffect(() => {
    let active = true;
    void browserClient(config).auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage("Could not load authenticators. Try again.");
      else { setFactors(data.totp); setSelected(data.totp[0]?.id ?? ""); setReady(true); }
    });
    return () => { active = false; };
  }, [config]);
  async function enroll() {
    setBusy(true); setMessage("");
    try {
      const result = await browserClient(config).auth.mfa.enroll({ factorType: "totp", friendlyName: factors.length ? "Backup authenticator" : "Primary authenticator", issuer: "Masjid Talhah Admin" });
      if (result.error || !result.data || result.data.type !== "totp") throw Error("enroll");
      // Sensitive provisioning material exists only in component memory until verification.
      setEnrollment({ id: result.data.id, qr: result.data.totp.qr_code, secret: result.data.totp.secret });
      setSelected(result.data.id);
    } catch { setMessage("Could not enroll an authenticator. Try again."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const client = browserClient(config);
      const result = await client.auth.mfa.challengeAndVerify({ factorId: selected, code });
      if (result.error) throw Error("verify");
      setEnrollment(null); setCode("");
      const refresh = await client.auth.refreshSession();
      if (refresh.error) throw Error("refresh");
      const response = await fetch("/admin/api/security", { cache: "no-store" });
      const state = await response.json();
      if (!response.ok || state.aal !== "aal2" || !state.has_totp || state.role === "super_admin" && !state.recent_mfa) throw Error("server verification");
      window.location.replace(next);
    } catch { setCode(""); setMessage("Verification failed. Enter a fresh code and try again."); }
    finally { setBusy(false); }
  }
  return <section ref={sensitive} className="admin-stack" data-admin-sensitive>
    {!ready && !message && <p role="status">Loading authenticators…</p>}
    {ready && !enrollment && <>
      <p>{factors.length ? "Select an authenticator, or enroll a separate backup device." : "Enroll your primary authenticator to continue."}</p>
      <button className="admin-button admin-button-secondary" disabled={busy || factors.length >= 2} onClick={() => void enroll()}>{factors.length ? "Add backup authenticator" : "Enroll authenticator"}</button>
    </>}
    {enrollment && <div className="admin-card" data-admin-sensitive>
      <p>Scan this code in your authenticator app. Keep this setup material private.</p>
      {/* Auth-generated data URL, never arbitrary HTML or application persistence. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="admin-qr" src={enrollment.qr} alt="Authenticator enrollment QR code" width={220} height={220} />
      <details><summary>Manual setup key</summary><code>{enrollment.secret}</code></details>
    </div>}
    {selected && <form className="admin-stack" onSubmit={verify}>
      {!enrollment && <label>Authenticator<select value={selected} onChange={event => setSelected(event.target.value)}>{factors.map((factor, index) => <option key={factor.id} value={factor.id}>{factor.friendly_name || `Authenticator ${index + 1}`}</option>)}</select></label>}
      <label>6-digit code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} /></label>
      <button className="admin-button" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}</button>
    </form>}
    {message && <p role="alert">{message}</p>}
  </section>;
}
