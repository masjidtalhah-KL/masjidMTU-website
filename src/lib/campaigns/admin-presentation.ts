import { AdminError } from "@/lib/admin/policy";
import type { LifecycleAction, Windows } from "./lifecycle-contract";
import type { CampaignStatus } from "./management-contract";
export const statusLabels: Record<CampaignStatus, string> = {
  draft: "Draf", scheduled: "Dijadualkan", open: "Dibuka", paused: "Dijeda", closed: "Ditutup", archived: "Diarkibkan",
};
export const actionLabels: Record<LifecycleAction, string> = {
  schedule: "Jadualkan", unschedule: "Batalkan penjadualan", open: "Buka kempen", pause: "Jeda kempen",
  resume: "Sambung kempen", close: "Tutup kempen", archive: "Arkibkan",
};
export const auditLabels: Record<string, string> = {
  "campaign.create": "Kempen dicipta", "campaign.update": "Maklumat kempen dikemas kini", "schedule.change": "Jadual diubah",
  "lifecycle.schedule": "Kempen dijadualkan", "lifecycle.unschedule": "Penjadualan dibatalkan", "lifecycle.open": "Kempen dibuka",
  "lifecycle.pause": "Kempen dijeda", "lifecycle.resume": "Kempen disambung", "lifecycle.close": "Kempen ditutup", "lifecycle.archive": "Kempen diarkibkan",
};
export function campaignTime(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) + " MYT" : "Tidak ditetapkan";
}
export function localCampaignTime(value: string | null): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (key: string) => parts.find(p => p.type === key)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}
export function malaysiaInstant(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) throw new AdminError(422, "invalid");
  const normalized = value.length === 16 ? value + ":00" : value;
  const time = new Date(normalized + "+08:00");
  if (!Number.isFinite(time.getTime()) || localCampaignTime(time.toISOString()) !== normalized) throw new AdminError(422, "invalid");
  return time.toISOString();
}
export function scheduleFormWindows(input: Record<keyof Windows, string>, current: Windows): Windows {
  const result = {} as Windows;
  for (const key of Object.keys(input) as (keyof Windows)[]) {
    // Preserve DB microseconds when an existing displayed field was not edited.
    result[key] = input[key] === localCampaignTime(current[key]) ? current[key] : malaysiaInstant(input[key]);
  }
  return result;
}
export function lifecycleWarning(action: LifecycleAction, status: CampaignStatus): string {
  if (action === "close") return "Kempen yang ditutup tidak boleh dibuka semula. Program baharu memerlukan kempen baharu.";
  if (action === "archive") return "Arkib ialah status akhir. Kempen tidak boleh keluar daripada arkib.";
  if (status === "draft" && ["open", "schedule"].includes(action)) return "Meninggalkan draf mengunci slug secara kekal. Batalkan penjadualan kemudian tidak akan membuka semula slug.";
  if (action === "unschedule") return "Tarikh kekal disimpan dan slug yang sudah dikunci kekal terkunci.";
  return "Tindakan ini menggunakan versi kempen yang dimuatkan. Database akan mengesahkan status dan waktu semasa.";
}
export const conflictMessage = "Kempen ini telah berubah sejak halaman dibuka. Muat semula data terkini sebelum cuba lagi.";
