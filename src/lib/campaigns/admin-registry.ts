import { createElement, type ComponentType } from "react";
import { AdminError } from "@/lib/admin/policy";
import type { Json } from "@/lib/supabase/database.types";

export type Configuration = { [key: string]: Json };
export type TypeDescriptor = { type_key: string; config_version: number; module_flag_key: string };
export type ConfigurationFormProps<C extends Configuration = Configuration> = {
  value: C; onChange: (value: C) => void; disabled: boolean;
};
export type CampaignAdminAdapter<C extends Configuration = Configuration> = TypeDescriptor & {
  label: string; parseConfiguration: (value: unknown) => C | null;
  defaults: () => C; ConfigurationForm: ComponentType<ConfigurationFormProps<C>>;
};

// Future reviewed domains can retain a concrete config type behind this boundary.
export function defineCampaignAdminAdapter<C extends Configuration>(definition: CampaignAdminAdapter<C>): CampaignAdminAdapter {
  return { ...definition, ConfigurationForm: function TypedConfigurationForm(props) {
    const value = parseAdapterConfiguration(definition as unknown as CampaignAdminAdapter, props.value) as C | null;
    if (!value) return null;
    return createElement(definition.ConfigurationForm, { ...props, value, onChange: next => {
      const parsed = parseAdapterConfiguration(definition as unknown as CampaignAdminAdapter, next);
      if (parsed) props.onChange(parsed);
    } });
  } };
}

// Intentionally empty. No environment/test switch or dynamic type registration.
export const campaignAdminAdapters: readonly CampaignAdminAdapter[] = Object.freeze([]);

function canonicalConfiguration(value: unknown): string {
  const visit = (item: unknown): unknown => {
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(item))) {
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, visit((item as Record<string, unknown>)[key])]));
    }
    throw Error("Invalid configuration");
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid configuration");
  const encoded = JSON.stringify(visit(value));
  if (new TextEncoder().encode(encoded).length > 4096) throw Error("Invalid configuration");
  return encoded;
}
export function parseAdapterConfiguration(adapter: CampaignAdminAdapter, value: unknown): Configuration | null {
  try {
    const original = canonicalConfiguration(value), parsed = adapter.parseConfiguration(value);
    // A parser cannot quietly strip unknown keys or replace malformed input with defaults.
    return parsed && original === canonicalConfiguration(parsed) ? parsed : null;
  } catch { return null; }
}

export function campaignTypeCatalog(value: unknown): TypeDescriptor[] {
  if (!Array.isArray(value) || value.length > 100) throw new AdminError(503, "unavailable");
  const seen = new Set<string>();
  return value.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).length !== 3) throw new AdminError(503, "unavailable");
    const d = item as TypeDescriptor;
    if (typeof d.type_key !== "string" || !/^[a-z][a-z0-9_]{1,47}$/.test(d.type_key) ||
      !Number.isInteger(d.config_version) || d.config_version < 1 || d.config_version > 2147483647 ||
      typeof d.module_flag_key !== "string" || !/^[a-z][a-z0-9_]{1,47}\.enabled$/.test(d.module_flag_key) ||
      d.module_flag_key === "campaigns.enabled" || seen.has(`${d.type_key}:${d.config_version}`)) throw new AdminError(503, "unavailable");
    seen.add(`${d.type_key}:${d.config_version}`);
    return { type_key: d.type_key, config_version: d.config_version, module_flag_key: d.module_flag_key };
  });
}

export function availableCampaignTypes(catalog: readonly TypeDescriptor[], adapters = campaignAdminAdapters): CampaignAdminAdapter[] {
  return adapters.filter(a => {
    try { return catalog.some(d => d.type_key === a.type_key && d.config_version === a.config_version &&
      d.module_flag_key === a.module_flag_key) && adapters.filter(other => other.type_key === a.type_key &&
      other.config_version === a.config_version).length === 1 && typeof a.label === "string" && a.label.length > 0 && a.label.length <= 80 &&
      !!parseAdapterConfiguration(a, a.defaults()); } catch { return false; }
  });
}
export function campaignEditor(catalog: readonly TypeDescriptor[], type: string, version: number, config: unknown,
  adapters = campaignAdminAdapters): CampaignAdminAdapter | null {
  const adapter = availableCampaignTypes(catalog, adapters).find(a => a.type_key === type && a.config_version === version);
  return adapter && parseAdapterConfiguration(adapter, config) ? adapter : null;
}
