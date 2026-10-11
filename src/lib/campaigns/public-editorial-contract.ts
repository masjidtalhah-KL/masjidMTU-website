import type { PublicCampaign, PublicCampaignOperational } from "./public-contract";

export type CampaignEditorialLocator = {
  project_id: string; dataset: string; document_type: "program"; document_id: string;
};
export type CampaignEditorial = { description: string };
export function campaignEditorialLocator(value: unknown): CampaignEditorialLocator | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== 4 || !["project_id", "dataset", "document_type", "document_id"].every(key => Object.hasOwn(data, key)) ||
    typeof data.project_id !== "string" || !/^[a-z0-9]{8}$/.test(data.project_id) ||
    typeof data.dataset !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(data.dataset) || data.document_type !== "program" ||
    typeof data.document_id !== "string" || !/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/.test(data.document_id) ||
    /^(drafts|versions)\./.test(data.document_id)) return null;
  return { project_id: data.project_id, dataset: data.dataset, document_type: "program", document_id: data.document_id };
}
export function editorialEnvironmentMatches(locator: CampaignEditorialLocator, environment: { projectId: string; dataset: string }) {
  return locator.project_id === environment.projectId && locator.dataset === environment.dataset;
}
/** Only exact published program description; unknown fields and operational-looking values are discarded. */
export function campaignEditorial(value: unknown, locator: CampaignEditorialLocator): CampaignEditorial | null {
  if (!campaignEditorialLocator(locator)) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (data._id !== locator.document_id || data._type !== "program" || typeof data.description !== "string" ||
    !data.description.trim() || data.description.length > 400 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data.description)) return null;
  return { description: data.description.trim() };
}
export async function composePublicCampaign(
  operational: PublicCampaignOperational | null,
  resolvePublished: (locator: CampaignEditorialLocator) => Promise<unknown>,
): Promise<{ campaign: PublicCampaign; editorial: CampaignEditorial | null } | null> {
  if (!operational) return null;
  const { editorial_locator: locator, ...campaign } = operational;
  const editorial = locator ? campaignEditorial(await resolvePublished(locator), locator) : null;
  // Locator is never included in public React props, even when a binding is unavailable.
  return { campaign, editorial };
}
