async function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the poster asset."));
    reader.readAsDataURL(blob);
  });
}

export function allowedPosterAsset(href: string, origin: string, cmsBase?: string) {
  const url = new URL(href, origin);
  if (url.username || url.password) return false;
  if (url.origin === origin) return true;
  return cmsBase === "https://cdn.sanity.io/images/2o95jmms/production/" && url.protocol === "https:" && url.origin === "https://cdn.sanity.io" && url.href.startsWith(cmsBase) && /^\/[\w/.-]+$/.test(url.pathname);
}
async function posterCanvas(svg: SVGSVGElement, paper: "A4" | "A3", cmsBase?: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  if (svg.dataset.fontsReady !== "true") throw new Error("Wait for poster fonts to finish measuring.");
  if (svg.dataset.overflow) throw new Error(`Text overflows date ${svg.dataset.overflow}. Shorten it before exporting.`);
  const snapshot = svg.cloneNode(true) as SVGSVGElement;
  const assets = new Map<string, Promise<string>>();
  // Embed same-origin assets once each; repeated portraits share the same decoded data.
  await Promise.all(Array.from(snapshot.querySelectorAll("image")).map(async (image) => {
    const href = image.getAttribute("href");
    if (!href) return;
    // Local original raster bytes are already embedded; never upload or re-encode the source.
    if (/^data:image\/(png|jpeg|webp);base64,/.test(href)) return;
    const url = new URL(href, window.location.origin);
    if (!allowedPosterAsset(href, window.location.origin, cmsBase)) throw new Error("Poster assets must be same-origin or on the approved Sanity project CDN.");
    if (!assets.has(url.href)) assets.set(url.href, (async () => {
      const response = await fetch(url, { credentials: url.origin === window.location.origin ? "same-origin" : "omit" });
      if (!response.ok) throw new Error(`Could not read poster asset: ${url.pathname}`);
      return dataUrl(await response.blob());
    })());
    image.setAttribute("href", await assets.get(url.href)!);
  }));
  const [width, height] = paper === "A3" ? [4961, 3508] : [3508, 2480];
  snapshot.setAttribute("width", String(width)); snapshot.setAttribute("height", String(height));
  const objectUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(snapshot)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image(); image.src = objectUrl; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser does not support canvas export.");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(objectUrl); }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  // Let the browser start the download before releasing its source.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// A single raster page needs only a small PDF container. No new PDF/animation dependency.
export function rasterPdf(canvas: Pick<HTMLCanvasElement, "width" | "height" | "toDataURL">, paper: "A4" | "A3"): Blob {
  const jpeg = Uint8Array.from(atob(canvas.toDataURL("image/jpeg", .95).split(",")[1]), (char) => char.charCodeAt(0));
  const [width, height] = paper === "A3" ? [1190.55, 841.89] : [841.89, 595.28];
  const encode = (text: string) => new TextEncoder().encode(text);
  const content = `q\n${width} 0 0 ${height} 0 0 cm\n/Poster Do\nQ\n`;
  const parts: Uint8Array[] = [encode("%PDF-1.4\n")];
  const offsets = [0]; let length = parts[0].length;
  const append = (bytes: Uint8Array) => { parts.push(bytes); length += bytes.length; };
  const object = (id: number, body: string, stream?: Uint8Array) => {
    offsets[id] = length; append(encode(`${id} 0 obj\n${body}\n`));
    if (stream) { append(encode("stream\n")); append(stream); append(encode("\nendstream\n")); }
    append(encode("endobj\n"));
  };
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Poster 4 0 R >> >> /Contents 5 0 R >>`);
  object(4, `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  object(5, `<< /Length ${encode(content).length} >>`, encode(content));
  const xref = length;
  append(encode(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return new Blob(parts.map((part) => part.buffer as ArrayBuffer), { type: "application/pdf" });
}

export async function exportPoster(svg: SVGSVGElement, format: "png" | "pdf", filename: string, paper: "A4" | "A3", cmsBase?: string) {
  const canvas = await posterCanvas(svg, paper, cmsBase);
  if (format === "pdf") { download(rasterPdf(canvas, paper), `${filename}-prototype.pdf`); return; }
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not generate PNG.")), "image/png"));
  download(blob, `${filename}-prototype.png`);
}
