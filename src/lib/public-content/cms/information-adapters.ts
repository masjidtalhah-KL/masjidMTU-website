import { mapContact, mapImage } from "./adapters";
import { PublicContentError } from "./read-policy";
import type { ContactDetails } from "../contact";
import type { DonationContent, NcrService } from "./information-types";

type Value = Record<string, unknown>;
function record(value: unknown, field: string): Value {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PublicContentError(`Invalid published public information: ${field}`);
  return value as Value;
}
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new PublicContentError(`Invalid published public information: ${field}`);
  return value.trim();
}
export function mapSettingsInformation(value: unknown, assetBase: string): { contact: ContactDetails; donation: DonationContent } {
  const settings = record(value, "siteSettings");
  const contact = mapContact(settings);
  let ncr: NcrService | null = null;
  if (settings.ncrService != null) {
    const source = record(settings.ncrService, "ncrService");
    if (!Array.isArray(source.officers) || source.officers.length < 1 || source.officers.length > 10) throw new PublicContentError("Invalid published public information: ncrService.officers");
    const names = new Set<string>();
    ncr = {
      heading: text(source.heading, "ncrService.heading", 160), introduction: text(source.introduction, "ncrService.introduction", 400),
      officers: source.officers.map((value) => {
        const officer = record(value, "ncrService.officer");
        const name = text(officer.name, "ncrService.name", 160);
        const label = text(officer.phone, "ncrService.phone", 40);
        if (names.has(name) || !/^\+?[\d\s()-]+$/.test(label) || !/^\+?\d{7,15}$/.test(label.replace(/[\s()-]/g, ""))) throw new PublicContentError("Invalid published public information: ncrService officer identity/phone");
        names.add(name);
        return { name, role: text(officer.role, "ncrService.role", 160), phone: { label, href: `tel:${label.replace(/[\s()-]/g, "")}` as const } };
      }),
      poster: source.poster == null ? null : mapImage(source.poster, assetBase, "ncrService.poster"),
    };
  }
  let information: DonationContent["information"] = null;
  if (settings.donationInfo != null) {
    const source = record(settings.donationInfo, "donationInfo");
    const qr = record(source.primaryQr, "donationInfo.primaryQr");
    // QR artwork is displayed byte-for-byte: no crop/hotspot transformations are accepted.
    if (qr.crop != null || qr.hotspot != null) throw new PublicContentError("Invalid published public information: QR crop/hotspot is forbidden");
    information = {
      heading: text(source.heading, "donationInfo.heading", 160), copy: text(source.copy, "donationInfo.copy", 600),
      recipientLabel: text(source.recipientLabel, "donationInfo.recipientLabel", 200),
      primaryQr: mapImage(qr, assetBase, "donationInfo.primaryQr"),
    };
  }
  return { contact: ncr ? { ...contact, ncrService: ncr } : contact, donation: { source: "sanity", information } };
}
export const unavailableDonationContent = (): DonationContent => ({ source: "unavailable", information: null });
