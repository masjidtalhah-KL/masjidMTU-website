import type { PosterImage } from "./model";

/** Read original bytes locally. No resize, upload, Sanity client or persistence. */
export async function readLocalPoster(file: File): Promise<PosterImage> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Pilih gambar PNG, JPG atau WebP.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Had fail ialah 25 MB.");
  const bytes = await file.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gambar setempat tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
  const image = new Image(); image.src = src;
  try { await image.decode(); } catch { throw new Error("Gambar tidak dapat dibuka."); }
  return { src, width: image.naturalWidth, height: image.naturalHeight, alt: `Poster program khas setempat: ${file.name}`, localHash: hash };
}
