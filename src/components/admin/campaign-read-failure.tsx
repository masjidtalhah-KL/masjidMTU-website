import { redirect } from "next/navigation";
import { AdminError } from "@/lib/admin/policy";
export function CampaignReadFailure({ error, next = "/admin/campaigns" }: { error: unknown; next?: string }) {
  if (error instanceof AdminError) {
    if (error.status === 401) redirect("/admin/login?state=signed-out");
    if (["mfa", "step-up"].includes(error.reason)) redirect(`/admin/mfa?next=${encodeURIComponent(next)}`);
    if (error.status === 403) redirect("/admin/login?state=denied");
  }
  return <section className="admin-card" role="alert"><h2>Data operasi tidak tersedia</h2>
    <p>Data kempen belum dapat disahkan. Muat semula halaman apabila sambungan pulih.</p><a href={next}>Cuba muat semula</a></section>;
}
