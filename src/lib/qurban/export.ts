import "server-only";
import {adminContext} from "@/lib/admin/dal";import {databaseError} from "@/lib/admin/http";import {campaignManager} from "@/lib/campaigns/lifecycle-contract";import {uuid} from "./admin-contract";import {generateQurbanExport,type ExportSnapshot} from "./export-workbook";
export async function exportQurban(id:string){const {client,state}=await adminContext("operational",true);campaignManager(state);const target_campaign=uuid(id);const snapshot=await client.rpc("admin_qurban_export_snapshot",{target_campaign});databaseError(snapshot.error);const s=snapshot.data as unknown as ExportSnapshot;
 // Serialization must succeed before completed export audit; snapshot JSON never enters browser.
 return generateQurbanExport(s,async(reference,hash)=>{const done=await client.rpc("admin_qurban_export_complete",{target_campaign,export_reference:uuid(reference),snapshot_fingerprint:hash});databaseError(done.error);});}
