import type { Action, SanityClient } from "@sanity/client";
import { applyRecurringRules, type MonthSchedule, type PosterImage, type PosterSettings, type RecurringRule, type Speaker, type CmsImage, lectureMonthDocumentId } from "./model";
import { deserializeMonth, imageView, serializeMonth, stableJson, validateCmsImage, validateMonthDocument, type MonthDocument } from "./month-document";

export const LECTURE_TARGET={projectId:"2o95jmms",dataset:"production"} as const;
export type BaseState={draft:MonthDocument|null;published:MonthDocument|null};
export type AssetPlan={assetId:string;sha1:string;sha256:string;size:number;mimeType:string;filename:string;width:number;height:number;exists:boolean};
export type SavePlan={target:typeof LECTURE_TARGET;documentId:string;operation:"create"|"update";draftRevision:string|null;publishedRevision:string|null;payload:MonthDocument;assets:AssetPlan[];references:string[];draftsBefore:number;draftsAfter:number;fingerprint:string};
export type PreparedSave={plan:SavePlan;files:Map<string,File>};
export type LoadedMonth={base:BaseState;schedule:MonthSchedule;showInfaq:boolean;speakers:Speaker[];rules:RecurringRule[];donationQr?:PosterImage;warning?:string;saveResult?:"saved"|"unchanged"};
export type SaveApproval={fingerprint:string};
export type DraftAdapter={load:(year:number,month:number)=>Promise<LoadedMonth>;prepare:(schedule:MonthSchedule,speakers:Speaker[],settings:PosterSettings,base:BaseState)=>Promise<PreparedSave>;save:(prepared:PreparedSave,base:BaseState)=>Promise<LoadedMonth>};

export class DraftConflict extends Error { constructor(message="Revision conflict. Your local edits are preserved; reload for review."){super(message);this.name="DraftConflict";} }
export async function sha(bytes:ArrayBuffer,algorithm:"SHA-1"|"SHA-256"){return Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,bytes)),b=>b.toString(16).padStart(2,"0")).join("");}
export async function fingerprint(plan:Omit<SavePlan,"fingerprint">){return sha(new TextEncoder().encode(stableJson(plan)).buffer,"SHA-256");}
function configured(client:SanityClient){const c=client.config();if(c.projectId!==LECTURE_TARGET.projectId||c.dataset!==LECTURE_TARGET.dataset||c.perspective!=="raw"||c.useCdn||c.maxRetries!==0)throw new Error("Client must use authenticated Studio, the intended target, raw perspective, no CDN and no retries.");}
const content=(doc:MonthDocument)=>({...doc,_rev:undefined,_createdAt:undefined,_updatedAt:undefined});
const referenceIds=(doc:MonthDocument)=>[...new Set([...JSON.stringify(doc).matchAll(/"_ref":"([^"]+)"/g)].map(m=>m[1]))].sort();
function sameBase(a:BaseState,b:BaseState){if((a.draft?._rev??null)!==(b.draft?._rev??null)||(a.published?._rev??null)!==(b.published?._rev??null))throw new DraftConflict();}
export async function readBase(client:SanityClient,year:number,month:number):Promise<BaseState>{
  configured(client);const id=lectureMonthDocumentId(year,month);
  const result=await client.fetch<MonthDocument[]>('*[_id in $ids]',{ids:[id,`drafts.${id}`]});
  const base={draft:result.find(d=>d._id===`drafts.${id}`)||null,published:result.find(d=>d._id===id)||null};
  for(const d of result)if(d._type!=="lectureMonth"||typeof d._rev!=="string"||!d._rev)throw new Error("Invalid month document or revision.");
  return base;
}
export async function loadMonth(client:SanityClient,year:number,month:number):Promise<LoadedMonth>{
  configured(client);lectureMonthDocumentId(year,month);
  const [base,library,settings]=await Promise.all([readBase(client,year,month),client.fetch<{speakers:{id:string;name:string;defaultTopic?:string;isActive:boolean;photo?:CmsImage}[];rules:RecurringRule[]}>(`{"speakers":*[_type=="lectureSpeaker" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]|order(_id asc){"id":_id,name,defaultTopic,isActive,photo},"rules":*[_type=="lectureRule" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]|order(_id asc){"id":_id,weekday,occurrence,sessionType,"speakerId":speaker._ref,topic,isActive}}`),client.fetch<{donationInfo?:{compactQr?:CmsImage}}|null>('*[_id=="siteSettings"][0]{donationInfo{compactQr}}')]);
  const c=client.config();
  const speakers:Speaker[]=library.speakers.map(s=>({id:s.id,name:s.name,defaultTopic:s.defaultTopic||"",isActive:s.isActive, ...(s.photo?{photo:imageView(s.photo,c.projectId!,c.dataset!)}:{})}));
  const rules=library.rules.map(r=>({...r,speakerId:r.speakerId||"",topic:r.topic||""}));
  for(const s of speakers)if(typeof s.name!=="string"||typeof s.isActive!=="boolean")throw new Error("Invalid Penceramah library.");
  for(const r of rules)if(!Number.isInteger(r.weekday)||r.weekday<0||r.weekday>6||!Number.isInteger(r.occurrence)||r.occurrence<0||r.occurrence>5||!["subuh","maghrib","jumaat","yasin"].includes(r.sessionType)||typeof r.isActive!=="boolean")throw new Error("Invalid CMS recurring rules.");
  const document=base.draft||base.published;
  const schedule=document?deserializeMonth(document,c.projectId!,c.dataset!):{year,month,entries:applyRecurringRules(year,month,rules)};
  let donationQr:PosterImage|undefined,warning:string|undefined;
  const compactQr = settings?.donationInfo?.compactQr;
  if(compactQr){
    // Reject all crop/hotspot metadata, including zero crops: preserve the approved quiet zone.
    try { const image=imageView(compactQr,c.projectId!,c.dataset!);if(image.width!==image.height||compactQr.crop||compactQr.hotspot)throw new Error("Invalid compact QR shape.");donationQr=image; }
    catch { warning="Approved compact Masjid QR is invalid; Infaq panel omitted."; }
    if(donationQr){const asset=await client.getDocument(donationQr.assetId!);if(!asset||asset._type!=="sanity.imageAsset"){donationQr=undefined;warning="Approved compact Masjid QR asset is missing; Infaq panel omitted.";}}
  } else warning="Approved compact Masjid QR is unavailable; Infaq panel omitted. The branded public donation QR is not used.";
  if(!document&&!rules.some(r=>r.isActive))warning=[warning,"No active published rules. The new month is empty; no demo data is migrated."].filter(Boolean).join(" ");
  return {base,schedule,speakers,rules,showInfaq:document?.showInfaq??true,donationQr,warning};
}
export async function prepareSave(client:SanityClient,schedule:MonthSchedule,speakers:Speaker[],settings:PosterSettings,base:BaseState):Promise<PreparedSave>{
  configured(client);sameBase(base,await readBase(client,schedule.year,schedule.month));
  const assets=new Map<string,AssetPlan>(),files=new Map<string,File>();
  const resolve=async(image:PosterImage|NonNullable<Speaker["photo"]>,alt:string):Promise<CmsImage>=>{
    if(image.cmsImage){const result={...structuredClone(image.cmsImage),alt};validateCmsImage(result);return result;}
    const assetId="assetId" in image?image.assetId:undefined;
    if(assetId){const result:CmsImage={_type:"editorialImage",asset:{_type:"reference",_ref:assetId},alt};validateCmsImage(result);return result;}
    const file=image.originalFile;if(!file)throw new Error("Demo/blob/path images cannot be saved without original bytes or a CMS reference.");
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>25*1024*1024||file.size===0)throw new Error("Image must be an original PNG/JPG/WebP, maximum 25 MB.");
    const bytes=await file.arrayBuffer(),hash=await sha(bytes,"SHA-256"),sha1=await sha(bytes,"SHA-1");
    if(image.localHash!==hash)throw new Error("Original file hash changed.");
    const ext=file.type==="image/jpeg"?"jpg":file.type.slice(6),id=`image-${sha1}-${image.width}x${image.height}-${ext}`;
    const result:CmsImage={_type:"editorialImage",asset:{_type:"reference",_ref:id},alt};validateCmsImage(result);
    if(!assets.has(id)){
      const matches=await client.fetch<{_id:string;size:number;mimeType:string}[]>('*[_type=="sanity.imageAsset" && sha1hash==$hash]{_id,size,mimeType}',{hash:sha1});
      if(matches.some(a=>a._id!==id||a.size!==file.size||a.mimeType!==file.type))throw new Error("Matching asset hash has different metadata.");
      assets.set(id,{assetId:id,sha1,sha256:hash,size:file.size,mimeType:file.type,filename:file.name,width:image.width,height:image.height,exists:matches.length>0});files.set(id,file);
    }
    return result;
  };
  const payload=await serializeMonth(schedule,speakers,settings,resolve);
  const references=referenceIds(payload),planned=new Set(assets.keys());
  const expected=new Map<string,string>();
  for(const entry of payload.entries)for(const session of entry.sessions)for(const [reference,type] of [[session.speaker,"lectureSpeaker"],[session.sourceRule,"lectureRule"]] as const)if(reference){if(expected.has(reference._ref)&&expected.get(reference._ref)!==type)throw new Error("Reference has conflicting document types.");expected.set(reference._ref,type);}
  for(const id of references)if(!planned.has(id)) {const ref=await client.getDocument(id);if(!ref||ref._type!==(id.startsWith("image-")?"sanity.imageAsset":expected.get(id)))throw new Error("Reference unavailable or wrong type: "+id);}
  const draftsBefore=await client.fetch<number>('count(*[_id in path("drafts.**")])');
  const without:Omit<SavePlan,"fingerprint">={target:LECTURE_TARGET,documentId:payload._id,operation:base.draft?"update":"create",draftRevision:base.draft?._rev??null,publishedRevision:base.published?._rev??null,payload,assets:[...assets.values()].sort((a,b)=>a.assetId.localeCompare(b.assetId)),references,draftsBefore,draftsAfter:draftsBefore+(base.draft?0:1)};
  return {plan:{...without,fingerprint:await fingerprint(without)},files};
}
export function draftActions(plan:SavePlan):Action[]{
  const publishedId=plan.documentId.replace(/^drafts\./,""),set={year:plan.payload.year,month:plan.payload.month,showInfaq:plan.payload.showInfaq,entries:plan.payload.entries};
  if(plan.draftRevision)return [{actionType:"sanity.action.document.edit",draftId:plan.documentId,publishedId,patch:{ifRevisionID:plan.draftRevision,set}}];
  if(plan.publishedRevision)return [
    {actionType:"sanity.action.document.version.create",publishedId,baseId:publishedId,versionId:plan.documentId,ifBaseRevisionId:plan.publishedRevision},
    {actionType:"sanity.action.document.version.replace",document:plan.payload},
  ];
  return [{actionType:"sanity.action.document.create",publishedId,attributes:plan.payload,ifExists:"fail"}];
}
export async function saveApprovedDraft(client:SanityClient,prepared:PreparedSave,base:BaseState,approval:SaveApproval|undefined,validate:(document:MonthDocument,uploaded?:boolean)=>Promise<void>):Promise<LoadedMonth>{
  if(!approval||approval.fingerprint!==prepared.plan.fingerprint)throw new Error("First-save plan is not owner-approved. No upload or write performed.");
  return saveDraft(client,prepared,base,validate);
}
/** Manual authenticated Studio saving; exact-batch approvals remain a separate audit workflow. */
export async function saveDraft(client:SanityClient,prepared:PreparedSave,base:BaseState,validate:(document:MonthDocument,uploaded?:boolean)=>Promise<void>):Promise<LoadedMonth>{
  configured(client);const {plan,files}=prepared;
  const {fingerprint:claimed,...without}=plan;
  if(await fingerprint(without)!==claimed)throw new Error("Save plan fingerprint changed. No upload or write performed.");
  if(plan.documentId!==`drafts.${lectureMonthDocumentId(plan.payload.year,plan.payload.month)}`||plan.payload._id!==plan.documentId||stableJson(plan.target)!==stableJson(LECTURE_TARGET))throw new Error("Invalid plan scope or target.");
  if(plan.draftRevision!==(base.draft?._rev??null)||plan.publishedRevision!==(base.published?._rev??null))throw new DraftConflict();
  validateMonthDocument(plan.payload);
  if(plan.assets.some(a=>!plan.references.includes(a.assetId)))throw new Error("Plan contains assets outside the payload.");
  if(await client.fetch<number>('count(*[_id in path("drafts.**")])')!==plan.draftsBefore)throw new DraftConflict("Draft count changed; prepare a fresh plan for review.");
  await validate(plan.payload,false);sameBase(base,await readBase(client,plan.payload.year,plan.payload.month));
  for(const asset of plan.assets){const file=files.get(asset.assetId);if(!file||await sha(await file.arrayBuffer(),"SHA-256")!==asset.sha256)throw new Error("Asset file changed before save.");}
  // Upload only after explicit manual saving and whole-month validation; one upload per original hash.
  // Assets may remain if a later conflict prevents the document save; never delete them automatically.
  for(const asset of plan.assets)if(!asset.exists){const uploaded=await client.assets.upload("image",files.get(asset.assetId)!,{filename:asset.filename});if(uploaded._id!==asset.assetId||uploaded.sha1hash!==asset.sha1||uploaded.size!==asset.size)throw new Error("Uploaded asset read-back mismatch; draft not written.");}
  for(const asset of plan.assets){const stored=await client.getDocument(asset.assetId);if(!stored||stored._type!=="sanity.imageAsset"||stored.sha1hash!==asset.sha1||stored.size!==asset.size||stored.mimeType!==asset.mimeType)throw new Error("Authenticated asset read-back mismatch; draft not written.");}
  await validate(plan.payload,true);sameBase(base,await readBase(client,plan.payload.year,plan.payload.month));
  if(base.draft&&stableJson(content(base.draft))===stableJson(content(plan.payload))){
    const loaded=await loadMonth(client,plan.payload.year,plan.payload.month);sameBase(base,loaded.base);
    if(!loaded.base.draft||stableJson(content(loaded.base.draft))!==stableJson(content(plan.payload)))throw new DraftConflict("Unchanged draft read-back mismatch. Your local edits are preserved.");
    return {...loaded,saveResult:"unchanged"};
  }
  let response;try { response=await client.action(draftActions(plan)); } catch(error) { if((error as {statusCode?:number}).statusCode===409)throw new DraftConflict();throw new Error("Save result is uncertain or rejected. Do not retry automatically; reload for review.",{cause:error}); }
  const result=response as typeof response & {results?:{status?:string;error?:unknown}[]};
  if(!result.transactionId||result.results?.some(r=>r.status==="error"||r.error))throw new Error("Save result is uncertain. Do not retry; reload for review.");
  const saved=await readBase(client,plan.payload.year,plan.payload.month);
  if(!saved.draft||stableJson(content(saved.draft))!==stableJson(content(plan.payload)))throw new DraftConflict("Draft read-back mismatch. Local edits are preserved; review remote before retrying.");
  if((saved.published?._rev??null)!==(base.published?._rev??null))throw new DraftConflict("Published base changed during save. No publication performed; review remote and draft.");
  const loaded=await loadMonth(client,plan.payload.year,plan.payload.month);sameBase(saved,loaded.base);return {...loaded,saveResult:"saved"};
}
export function workingSignature(schedule:MonthSchedule,showInfaq:boolean){return stableJson({schedule,showInfaq});}
export const canSwitchMonth=(dirty:boolean,saving:boolean,confirmed=false)=>!saving&&(!dirty||confirmed);
