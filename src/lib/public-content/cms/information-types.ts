import type { PublicImage } from "./types";

export interface NcrService {
  readonly heading: string;
  readonly introduction: string;
  readonly officers: readonly { readonly name: string; readonly role: string; readonly phone: { readonly label: string; readonly href: `tel:${string}` } }[];
  readonly poster: PublicImage | null;
}
export interface DonationInfo {
  readonly heading: string;
  readonly copy: string;
  readonly recipientLabel: string;
  readonly primaryQr: PublicImage;
}
export interface DonationContent {
  readonly source: "sanity" | "unavailable";
  readonly information: DonationInfo | null;
}
