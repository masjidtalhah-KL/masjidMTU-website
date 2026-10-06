"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { AccessInput, OwnerSnapshot } from "@/lib/admin/input";
export function UsersPanel({ initial, recentMfa }: { initial: OwnerSnapshot; recentMfa: boolean }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [stepUp, setStepUp] = useState(!recentMfa);
  async function mutate(input: AccessInput) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/admin/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === "step-up" || result.error === "mfa") { setStepUp(true); setMessage("Verify your authenticator again before making changes."); }
        else if (response.status === 401 || response.status === 403) { setSnapshot({users:[],invites:[],audit:[]}); window.location.replace("/admin/login?state=denied"); }
        else setMessage(response.status === 409 ? "This record changed or an invitation already exists. Reload before trying again." : "The change could not be saved. Try again.");
        return;
      }
      const refresh = await fetch("/admin/api/access", { cache: "no-store" });
      if (!refresh.ok) throw Error("refresh");
      setSnapshot(await refresh.json());
      setMessage(result.session_termination === "pending-staging" ? "Access blocked and audited. Provider session termination remains pending staging verification." : "Change saved.");
    } catch { setMessage("Could not confirm the latest state. Reload before making further changes."); }
    finally { setBusy(false); }
  }
  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void mutate({ operation: "invite", email: String(form.get("email")), role: form.get("role") === "admin" ? "admin" : "staff" });
  }
  const disabled = busy || stepUp;
  return <div className="admin-stack" data-admin-sensitive>
    {stepUp && <p role="status"><Link href="/admin/mfa?next=/admin/users" prefetch={false}>Verify your authenticator again</Link> to make access changes.</p>}
    <section className="admin-card"><h2>Invite a user</h2><form className="admin-invite-form" onSubmit={invite}>
      <label>Approved Google email<input name="email" type="email" maxLength={254} required disabled={disabled} /></label>
      <label>Role<select name="role" disabled={disabled}><option value="staff">staff</option><option value="admin">admin</option></select></label>
      <button className="admin-button" disabled={disabled}>Create invitation</button>
    </form><p className="admin-muted">Send the invitee the admin login address separately. No invitation email is sent automatically.</p></section>
    {message && <p role="status" aria-live="polite">{message}</p>}
    <section className="admin-card"><h2>Foundation users</h2><p className="admin-muted admin-table-hint">Scroll across to view actions.</p><div className="admin-table-scroll" role="region" aria-label="Foundation users and actions" tabIndex={0}><table><caption className="admin-sr-only">Foundation membership and permitted actions</caption><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {snapshot.users.map(user => <tr key={user.user_id}><td>{user.approved_email}</td><td>{user.role}</td><td>{user.status}</td><td><div className="admin-row-actions">
        {user.role === "super_admin" ? <span>Owner recovery procedure only</span> : <>
          {user.status !== "revoked" && <button disabled={disabled} onClick={() => { if (confirm(`Change ${user.approved_email} to ${user.role === "staff" ? "admin" : "staff"}?`)) void mutate({operation:"member",id:user.user_id,version:user.version,action:"role",role:user.role === "staff" ? "admin" : "staff"}); }}>Change role</button>}
          {user.status !== "revoked" && <button disabled={disabled} onClick={() => { if (confirm(`${user.status === "active" ? "Disable" : "Reactivate"} ${user.approved_email}?`)) void mutate({operation:"member",id:user.user_id,version:user.version,action:user.status === "active" ? "disable" : "reactivate"}); }}>{user.status === "active" ? "Disable" : "Reactivate"}</button>}
          {user.status !== "revoked" && <button disabled={disabled} onClick={() => { if (confirm(`Revoke access for ${user.approved_email}? A new invitation will be required.`)) void mutate({operation:"member",id:user.user_id,version:user.version,action:"revoke"}); }}>Revoke</button>}
        </>}
      </div></td></tr>)}
    </tbody></table></div></section>
    <section className="admin-card"><h2>Pending invitations</h2>{snapshot.invites.length === 0 ? <p>No pending invitations.</p> : <ul className="admin-invites">{snapshot.invites.map(invite => <li key={invite.id}><div><strong>{invite.email_normalized}</strong><span>{invite.role} · expires <time dateTime={invite.expires_at}>{new Date(invite.expires_at).toLocaleDateString("en-GB",{timeZone:"Asia/Kuala_Lumpur"})}</time></span></div><button disabled={disabled} onClick={() => { if (confirm(`Revoke invitation for ${invite.email_normalized}?`)) void mutate({operation:"revoke-invite",id:invite.id,version:invite.version}); }}>Revoke invitation</button></li>)}</ul>}</section>
    <section className="admin-card"><h2>Recent access history</h2>{snapshot.audit.length === 0 ? <p>No access events yet.</p> : <ol className="admin-audit">{snapshot.audit.map(event => <li key={event.id}><strong>{event.action}</strong><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString("en-GB",{timeZone:"Asia/Kuala_Lumpur"})} MYT</time><span>{event.old_role ?? event.old_status ?? "—"} → {event.new_role ?? event.new_status ?? "—"} · {event.actor_aal}</span><small>Actor: {event.actor_id ?? "system"} · Target: {event.target_id ?? event.invite_id ?? "—"}</small></li>)}</ol>}</section>
  </div>;
}
