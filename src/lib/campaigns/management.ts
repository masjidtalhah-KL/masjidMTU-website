import "server-only";
import { adminContext } from "@/lib/admin/dal";
import { databaseError } from "@/lib/admin/http";
import { AdminError } from "@/lib/admin/policy";
import { campaignManager, campaignId, lifecycleResult } from "./lifecycle-contract";
import { campaignTypeCatalog } from "./admin-registry";
import { campaignList, campaignDetail, campaignAudit, createCampaignCommand, updateCampaignCommand, type CampaignView } from "./management-contract";

export async function readCampaigns() {
  const { client, state } = await adminContext("operational");
  const result = await client.rpc("campaign_foundation_list", { page_size: 50 });
  databaseError(result.error);
  return { campaigns: campaignList(result.data), canManage: state.role !== "staff" };
}
export async function readCampaignTypes() {
  const { client, state } = await adminContext("operational");
  const result = await client.rpc("admin_campaign_types"); databaseError(result.error);
  return { catalog: campaignTypeCatalog(result.data), canManage: state.role !== "staff", recentMfa: state.role !== "super_admin" || state.recent_mfa };
}
export async function readCampaign(id: string): Promise<CampaignView | null> {
  const target = campaignId(id), { client, state } = await adminContext("operational");
  const [detail, types, audit] = await Promise.all([
    client.rpc("admin_campaign_detail", { target_campaign: target }), client.rpc("admin_campaign_types"),
    state.role === "staff" ? Promise.resolve(null) : client.rpc("campaign_audit_history", { target_campaign: target, page_size: 50 }),
  ]);
  databaseError(detail.error); databaseError(types.error); if (audit) databaseError(audit.error);
  const campaign = campaignDetail(detail.data);
  if (!campaign) return null;
  return { campaign, catalog: campaignTypeCatalog(types.data), audit: audit ? campaignAudit(audit.data, target) : null,
    canManage: state.role !== "staff", recentMfa: state.role !== "super_admin" || state.recent_mfa };
}
export async function createCampaign(value: unknown) {
  const { client, state } = await adminContext("operational", true); campaignManager(state);
  const types = await client.rpc("admin_campaign_types"); databaseError(types.error);
  const payload = createCampaignCommand(value, campaignTypeCatalog(types.data));
  const result = await client.rpc("admin_campaign_create", { payload }); databaseError(result.error);
  return lifecycleResult(result.data);
}
export async function updateCampaign(id: string, value: unknown) {
  const target = campaignId(id), { client, state } = await adminContext("operational", true); campaignManager(state);
  const [detail, types] = await Promise.all([client.rpc("admin_campaign_detail", { target_campaign: target }), client.rpc("admin_campaign_types")]);
  databaseError(detail.error); databaseError(types.error);
  const current = campaignDetail(detail.data); if (!current) throw new AdminError(403, "denied");
  const command = updateCampaignCommand(value, current, campaignTypeCatalog(types.data));
  const result = await client.rpc("admin_campaign_update", { target_campaign: target, expected_version: command.expectedVersion, payload: command.payload });
  databaseError(result.error); return lifecycleResult(result.data);
}
