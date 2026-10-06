export type BrowserConfig = { url: string; key: string; origin: string };
export function validateConfig(env: Record<string, string | undefined>): BrowserConfig {
  const failure = () => { throw new Error("Admin configuration unavailable"); };
  const mode = env.ADMIN_SUPABASE_ENV;
  if (mode !== "local" && mode !== "staging") return failure();
  let url: URL, origin: URL;
  try { url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? ""); origin = new URL(env.ADMIN_APP_ORIGIN ?? ""); } catch { return failure(); }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return failure();
  const local = (u: URL) => ["localhost", "127.0.0.1"].includes(u.hostname) && u.protocol === "http:";
  if (mode === "local" && (!local(url) || !local(origin))) return failure();
  if (mode === "staging" && (url.protocol !== "https:" || origin.protocol !== "https:" ||
    !/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) || url.hostname !== `${env.ADMIN_SUPABASE_PROJECT_REF}.supabase.co`)) return failure();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (mode === "staging" && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return failure();
  if (!key.startsWith("sb_publishable_")) {
    // Local CLI legacy anon JWT only. Never accept a service-role JWT as a public key.
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      if (mode !== "local" || payload.role !== "anon") return failure();
    } catch { return failure(); }
  } else if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return failure();
  return { url: url.origin, key, origin: origin.origin };
}
