"use client";
export default function AdminFailure({ reset }: { reset: () => void }) {
  return <main className="admin-auth"><h1>Admin unavailable</h1><p>We could not verify or load this request.</p>
    <button className="admin-button" onClick={reset}>Try again</button><a href="/admin/login?state=unavailable">Return to sign in</a></main>;
}
