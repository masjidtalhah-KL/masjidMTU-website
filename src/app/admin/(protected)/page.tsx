import { pageContext } from "@/lib/admin/dal";
export default async function AdminHome() {
  const { state } = await pageContext();
  return <><p className="admin-eyebrow">Admin foundation</p><h1>Home</h1>
    <p>Welcome to Masjid Talhah Bin Ubaidillah&apos;s internal workspace.</p>
    <section className="admin-card"><h2>Your access</h2><p>Your role is <strong>{state.role}</strong>.</p>
      <p>{state.role === "super_admin" ? "You can manage invitations and foundation access from Users." : "You can review your account and security settings."}</p></section>
  </>;
}
