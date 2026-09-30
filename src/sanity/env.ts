/** Public configuration only. Studio authentication never uses a frontend API token. */
function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Missing ${name}. Copy .env.example to .env.local and configure Sanity.`);
  return value.trim();
}

export const projectId = required(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, "NEXT_PUBLIC_SANITY_PROJECT_ID");
export const dataset = required(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET");
export const apiVersion = required(process.env.NEXT_PUBLIC_SANITY_API_VERSION, "NEXT_PUBLIC_SANITY_API_VERSION");

if (!/^[a-z0-9-]+$/.test(projectId)) throw new Error("Invalid Sanity project ID.");
if (!/^[a-z0-9_-]+$/.test(dataset)) throw new Error("Invalid Sanity dataset.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(apiVersion) || Number.isNaN(Date.parse(apiVersion))) {
  throw new Error("Sanity API version must be a fixed date in YYYY-MM-DD format.");
}
