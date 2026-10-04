import type { PosterImage } from "./model";

/** Read original bytes locally. No resize, upload, Sanity client or persistence. */
export async function readLocalPoster(file: File): Promise<PosterImage> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPG or WebP image.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Maximum file size is 25 MB.");
  const bytes = await file.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the local image."));
    reader.readAsDataURL(file);
  });
  const image = new Image(); image.src = src;
  try { await image.decode(); } catch { throw new Error("Could not open the image."); }
  return { src, width: image.naturalWidth, height: image.naturalHeight, alt: `Poster program khas setempat: ${file.name}`, localHash: hash, originalFile: file };
}
