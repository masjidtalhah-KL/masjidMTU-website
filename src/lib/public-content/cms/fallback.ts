import { publicAssets } from "../assets";
import { contact } from "../contact";
import { galleryPhotos } from "../gallery";
import { organisationSlots } from "../organisation";
import { profile } from "../profile";
import { surauList } from "../surau";
import type { ProfileContent, PublicGallery, PublicOrganisationSlot, PublicSurau } from "./types";

export function localProfile(captions: Readonly<Record<string, string>>): ProfileContent {
  return {
    introduction: profile.introduction.paragraphs, sourceNote: profile.introduction.sourceNote,
    vision: profile.vision, mission: profile.mission, motto: profile.motto,
    logoRationale: profile.logo.paragraphs,
    spaces: profile.spacePhotoIds.map((id) => ({ id, image: publicAssets[id], caption: captions[id] })),
  };
}
export function localOrganisation(): PublicOrganisationSlot[] {
  return organisationSlots.map(({ photoId, ...slot }) => ({ ...slot, photo: photoId ? publicAssets[photoId] : null }));
}
export function localSurau(): PublicSurau[] {
  return surauList.map(({ logoId, ...surau }) => ({ ...surau, logo: publicAssets[logoId] }));
}
export function localGallery(): PublicGallery {
  return {
    id: "galleryCollection-interior-masjid", title: "Interior Masjid",
    items: galleryPhotos.map((photo) => ({ ...publicAssets[photo.assetId], id: photo.id, category: photo.category, order: photo.order, caption: photo.caption || undefined })),
  };
}
export const localContact = () => contact;
