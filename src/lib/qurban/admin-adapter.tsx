import type { ConfigurationFormProps, CampaignAdapterDefinition } from "@/lib/campaigns/admin-registry";
import { initialQurbanFormState, parseQurbanConfiguration, parseQurbanFormState, type QurbanConfiguration, type QurbanFormState, type QurbanPurpose } from "./config";
export function QurbanConfigurationForm({ value, onChange, disabled }: ConfigurationFormProps<QurbanFormState>) {
  const numbers = [
    ["campaign_year", "Tahun kempen", 1900, 9999],
    ["price_per_cattle_share_minor", "Harga satu bahagian (sen, integer)", 1, 1000000000],
    ["cattle_count", "Bilangan lembu", 1, 10000],
    ["shares_per_cattle", "Bahagian setiap lembu", 1, 100],
  ] as const;
  const valid = !!parseQurbanConfiguration(value);
  return <fieldset disabled={disabled} aria-describedby="qurban-config-note"><legend>Konfigurasi Qurban / Aqiqah</legend>
    <p id="qurban-config-note">Masukkan nilai tahunan yang telah disemak. Tiada harga atau kapasiti contoh diisi secara automatik. Harga dimasukkan dalam sen penuh.</p>
    {numbers.map(([key, label, min, max]) => <label key={key} htmlFor={`qurban-${key}`}>{label}<input id={`qurban-${key}`} type="number" inputMode="numeric" min={min} max={max} step="1" required value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value === "" ? "" : Number(e.target.value) })} /></label>)}
    <label htmlFor="qurban-hijri">Label tahun Hijri / paparan<input id="qurban-hijri" required maxLength={80} value={value.hijri_display_label} onChange={e => onChange({ ...value, hijri_display_label: e.target.value })} /></label>
    <label htmlFor="qurban-currency">Mata wang<select id="qurban-currency" required value={value.currency} onChange={e => onChange({ ...value, currency: e.target.value })}><option value="">Pilih mata wang</option><option value="MYR">MYR</option></select></label>
    <fieldset><legend>Tujuan yang dibenarkan</legend>{(["qurban", "aqiqah"] as QurbanPurpose[]).map(p => <label key={p} className="campaign-check"><input type="checkbox" checked={value.allowed_purposes.includes(p)} onChange={e => onChange({ ...value, allowed_purposes: e.target.checked ? [...value.allowed_purposes, p] : value.allowed_purposes.filter(x => x !== p) })} />{p === "qurban" ? "Qurban" : "Aqiqah"}</label>)}</fieldset>
    <label htmlFor="qurban-akad">Rujukan versi akad yang diluluskan<input id="qurban-akad" required maxLength={80} value={value.approved_akad_version} onChange={e => onChange({ ...value, approved_akad_version: e.target.value })} /></label>
    <label htmlFor="qurban-limit">Had peserta bagi satu pendaftaran<input id="qurban-limit" required type="number" min={1} max={100} step="1" value={value.registration_rules.max_participants_per_registration} onChange={e => onChange({ ...value, registration_rules: { max_participants_per_registration: e.target.value === "" ? "" : Number(e.target.value) } })} /></label>
    <label htmlFor="qurban-whatsapp">Pautan group WhatsApp sukarelawan (pilihan)<input id="qurban-whatsapp" type="url" maxLength={154} value={value.volunteer_whatsapp_group_url ?? ""} onChange={e => onChange({ ...value, volunteer_whatsapp_group_url: e.target.value || null })} /></label>
    <p role="status">{valid ? "Konfigurasi lengkap untuk draf. Pembukaan pendaftaran masih memerlukan kelulusan akad tahunan dan semakan kesiapsiagaan domain." : "Konfigurasi belum lengkap atau tidak sah. Lengkapkan semua nilai yang telah disemak sebelum menyimpan."}</p>
  </fieldset>;
}
export const qurbanAdapterDefinition: CampaignAdapterDefinition<QurbanConfiguration, QurbanFormState> = {
  type_key: "qurban", config_version: 1, module_flag_key: "qurban.enabled", label: "Qurban / Aqiqah",
  defaults: initialQurbanFormState, parseFormState: parseQurbanFormState, parseConfiguration: parseQurbanConfiguration, ConfigurationForm: QurbanConfigurationForm,
};
