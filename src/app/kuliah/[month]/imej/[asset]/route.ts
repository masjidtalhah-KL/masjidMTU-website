import { getLecturePage } from "@/lib/public-content/lectures/server";
import { publishedPosterAsset } from "@/lib/public-content/lectures/images";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string; asset: string }> },
) {
  const { month, asset } = await params;
  const state = await getLecturePage(month);
  if (state.status === "unavailable")
    return new Response("Imej tidak tersedia buat sementara waktu.", {
      status: 503,
    });
  if (state.status !== "ready")
    return new Response("Tidak ditemui.", { status: 404 });
  const source = publishedPosterAsset(state.month, asset);
  if (!source) return new Response("Tidak ditemui.", { status: 404 });
  try {
    const image = await fetch(source, {
      cache: "force-cache",
      next: { revalidate: 300 },
      credentials: "omit",
    });
    if (!image.ok) throw new Error("Published image unavailable.");
    const contentType = image.headers.get("content-type");
    if (!contentType || !/^image\/(png|jpeg|webp)(;|$)/.test(contentType))
      throw new Error("Invalid image response.");
    return new Response(await image.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Imej tidak tersedia buat sementara waktu.", {
      status: 503,
    });
  }
}
