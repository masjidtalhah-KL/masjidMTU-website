import type { OrganisationSlot } from "../organisation";
import type { Surau } from "../surau";

/** Source-independent image data; layout always keeps the original aspect ratio. */
export interface PublicImage {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface ProfileContent {
  readonly introduction: readonly string[];
  readonly sourceNote: string | null;
  readonly vision: string;
  readonly mission: string;
  readonly motto: string;
  readonly logoRationale: readonly string[];
  readonly spaces: readonly { readonly id: string; readonly image: PublicImage; readonly caption: string | null }[];
}

export type PublicOrganisationSlot = Omit<OrganisationSlot, "photoId"> & { readonly photo: PublicImage | null };
export type PublicSurau = Omit<Surau, "logoId"> & { readonly logo: PublicImage | null };
export interface PublicGallery {
  readonly id: string;
  readonly title: string;
  readonly items: readonly (PublicImage & { readonly id: string; readonly category: string; readonly order: number; readonly caption?: string })[];
}

export interface ImageRecord {
  alt: string;
  asset: { _id: string; url: string; width: number; height: number } | null;
}
export interface ParagraphRecord {
  _type: "block";
  style: "normal";
  markDefs: unknown[];
  children: { _type: "span"; text: string; marks: unknown[] }[];
}
export interface MediaRecord { _key: string; image: ImageRecord; caption?: string | null }
export interface ProfileRecord {
  _id: string;
  introduction: ParagraphRecord[];
  sourceNote?: string | null;
  vision: string;
  mission: string;
  motto: string;
  logoRationale: ParagraphRecord[];
  spaceImages: MediaRecord[];
}
export interface OrganisationRecord {
  _id: string;
  role: string;
  group: string;
  isVacant: boolean;
  name?: string | null;
  employmentTitle?: string | null;
  photo?: ImageRecord | null;
  displayOrder: number;
  isActive: boolean;
}
export interface SurauRecord {
  _id: string;
  name: string;
  category: string;
  logo?: ImageRecord | null;
  address?: string | null;
  displayOrder: number;
  isActive: boolean;
}
export interface GalleryRecord { _id: string; title: string; category: string; items: MediaRecord[] }
export interface SettingsRecord {
  _id: string;
  mosqueName: string;
  address: string;
  phone: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  officeHours: { days: string; hours: string }[];
}
