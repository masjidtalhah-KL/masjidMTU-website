import type {ConfigurationFormProps,CampaignAdapterDefinition} from "@/lib/campaigns/admin-registry";
import {initialRamadanFormState,parseRamadanFormState,parseRamadanConfiguration,type RamadanConfiguration,type RamadanFormState} from "./config";
export function RamadanConfigurationForm({value,onChange,disabled}:ConfigurationFormProps<RamadanFormState>){
 return <fieldset disabled={disabled} aria-describedby="ramadan-config-note"><legend>Konfigurasi tahunan Ramadan</legend>
  <p id="ramadan-config-note">Masukkan tahun dan label yang telah disemak. Offering, tarikh, harga dan bilangan slot diurus melalui domain Ramadan pada fasa seterusnya.</p>
  <label htmlFor="ramadan-year">Tahun kempen<input id="ramadan-year" type="number" inputMode="numeric" min={1900} max={9999} step="1" required value={value.campaign_year} onChange={e=>onChange({...value,campaign_year:e.target.value===""?"":Number(e.target.value)})}/></label>
  <label htmlFor="ramadan-hijri">Label tahun Hijri / paparan<input id="ramadan-hijri" required maxLength={80} value={value.hijri_display_label} onChange={e=>onChange({...value,hijri_display_label:e.target.value})}/></label>
  <label htmlFor="ramadan-currency">Mata wang<select id="ramadan-currency" required value={value.currency} onChange={e=>onChange({...value,currency:e.target.value})}><option value="">Pilih mata wang</option><option value="MYR">MYR</option></select></label>
  <p role="status">{parseRamadanConfiguration(value)?"Konfigurasi tahunan lengkap untuk draf; aliran sponsorship belum dibuka.":"Lengkapkan konfigurasi tahunan yang diluluskan sebelum menyimpan."}</p>
 </fieldset>;
}
export const ramadanAdapterDefinition:CampaignAdapterDefinition<RamadanConfiguration,RamadanFormState>={type_key:"ramadan",config_version:1,module_flag_key:"ramadan.enabled",label:"Tajaan Ramadan",defaults:initialRamadanFormState,parseFormState:parseRamadanFormState,parseConfiguration:parseRamadanConfiguration,ConfigurationForm:RamadanConfigurationForm};
