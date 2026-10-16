import "server-only";
import type {Json} from "@/lib/supabase/database.types";
import {publicCampaignSlug} from "@/lib/campaigns/public-contract";
import {publicQurbanClient} from "./registration";import {QurbanError} from "./registration-contract";
import {volunteerContext,volunteerRequest,volunteerResult} from "./volunteer-contract";
export async function readVolunteerContext(slug:string){if(!publicCampaignSlug(slug))return null;try{const r=await publicQurbanClient().rpc("public_qurban_volunteer_context",{target_slug:slug}).abortSignal(AbortSignal.timeout(8000));if(r.error)throw new QurbanError(503,"unavailable");return volunteerContext(r.data,slug);}catch{throw new QurbanError(503,"unavailable");}}
export async function submitVolunteer(value:unknown){const payload=volunteerRequest(value);try{const r=await publicQurbanClient().rpc("public_qurban_volunteer_submit",{payload:payload as unknown as Json}).abortSignal(AbortSignal.timeout(15000));if(r.error)throw new QurbanError(r.error.code==="PT409"?409:r.error.code==="22023"?422:503,r.error.code==="PT409"?"conflict":r.error.code==="22023"?"invalid":"unavailable");return volunteerResult(r.data);}catch(e){throw e instanceof QurbanError?e:new QurbanError(503,"unavailable");}}
