import "server-only";
import { validateConfig } from "./config";
export function adminConfig() {
  return validateConfig({
    ADMIN_SUPABASE_ENV: process.env.ADMIN_SUPABASE_ENV,
    ADMIN_SUPABASE_PROJECT_REF: process.env.ADMIN_SUPABASE_PROJECT_REF,
    ADMIN_APP_ORIGIN: process.env.ADMIN_APP_ORIGIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
