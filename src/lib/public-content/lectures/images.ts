import type { PublicLectureMonth } from "./content";

const base = "https://cdn.sanity.io/images/2o95jmms/production/";
/** Uncropped CDN source, restricted to the selected published snapshot. */
export function publishedPosterAsset(month: PublicLectureMonth, id: string) {
  if (!/^image-[a-f0-9]{40}-[1-9]\d*x[1-9]\d*-(png|jpg|webp)$/.test(id)) return;
  for (const entry of month.schedule.entries) {
    for (const session of entry.sessions)
      if (session.photo?.cmsImage?.asset._ref === id) return session.photo.src;
    if (entry.specialPoster?.image.assetId === id)
      return entry.specialPoster.image.src;
  }
  if (month.showInfaq && month.compactQr?.assetId === id)
    return month.compactQr.src;
}

/** Public downloads avoid project CORS dependence; the server verifies references. */
export function publicPosterFetchUrl(href: string, month: string) {
  if (!href.startsWith(base)) return href;
  const file = href.slice(base.length);
  if (!/^[a-f0-9]{40}-[1-9]\d*x[1-9]\d*\.(png|jpg|webp)$/.test(file))
    throw new Error("Invalid poster asset URL.");
  return `/kuliah/${month}/imej/image-${file.replace(".", "-")}`;
}
