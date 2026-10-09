import "server-only";
import { adminContext } from "@/lib/admin/dal";
import { databaseError } from "@/lib/admin/http";
import { campaignWindowResult, campaignId, campaignManager, lifecycleCommand, lifecycleResult, scheduleCommand } from "./lifecycle-contract";
export async function commandLifecycle(id: string,value: unknown) {
  const target=campaignId(id),command=lifecycleCommand(value);
  const {client,state}=await adminContext("operational",true); campaignManager(state);
  const result=await client.rpc("admin_campaign_lifecycle",{target_campaign:target,command_action:command.action,expected_version:command.expectedVersion});
  databaseError(result.error); return lifecycleResult(result.data);
}
export async function editCampaignSchedule(id: string,value: unknown) {
  const target=campaignId(id),command=scheduleCommand(value);
  const {client,state}=await adminContext("operational",true); campaignManager(state);
  const result=await client.rpc("admin_campaign_schedule",{target_campaign:target,expected_version:command.expectedVersion,windows:command.windows});
  databaseError(result.error); return lifecycleResult(result.data);
}
export async function readCampaignWindow(id: string) {
  const {client}=await adminContext("operational");
  const result=await client.rpc("admin_campaign_window",{target_campaign:campaignId(id)});
  databaseError(result.error); return campaignWindowResult(result.data);
}
