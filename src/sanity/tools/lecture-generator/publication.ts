import type { Action, SanityClient } from "@sanity/client";
import { assertLectureClient, DraftConflict, LECTURE_TARGET, loadMonth, readBase, sha, type BaseState, type LoadedMonth } from "./draft-persistence";
import { stableJson, validateMonthDocument, type MonthDocument } from "./month-document";
import { lectureMonthDocumentId } from "./model";

export type PublicationPlan = {
  target: typeof LECTURE_TARGET; year: number; month: number;
  draftId: string; draftRevision: string; publishedId: string; publishedRevision: string | null;
  dates: number; sessions: number; references: string[]; assetReferences: string[];
  contentFingerprint: string; payload: MonthDocument;
  validation: { schema: "passed"; references: "resolved" };
  expected: { draft: "absent"; published: "exact-reviewed-content-with-new-server-revision"; assetMutations: 0; otherDocumentMutations: 0 };
  fingerprint: string;
};
export class PublicationUncertain extends Error {
  constructor(message="Publication is not verified. Do not retry automatically. Reload for review; your local state is preserved.", options?: ErrorOptions) { super(message, options); this.name="PublicationUncertain"; }
}
// Strip only server metadata and version identity. Never normalize or re-encode source text.
export function publicationContent(document: MonthDocument) {
  const { _id, _rev, _createdAt, _updatedAt, ...content } = document as MonthDocument & { _createdAt?: string; _updatedAt?: string };
  void _id; void _rev; void _createdAt; void _updatedAt;
  return content;
}
export const publicationDigest = (value: unknown) => sha(new TextEncoder().encode(stableJson(value)).buffer, "SHA-256");
export function publicationEligibility(base: BaseState | undefined, year: number, month: number, dirty: boolean) {
  if (dirty) return "Unsaved changes. Save Draft explicitly, then review before publication.";
  if (!base?.draft) return "No saved Sanity draft for this month.";
  if (!base.draft._rev) return "Draft revision is unknown. Reload for review.";
  try {
    if (base.draft._id !== `drafts.${lectureMonthDocumentId(year,month)}` || base.draft.year !== year || base.draft.month !== month) return "Selected month/year does not match the saved draft.";
    validateMonthDocument(base.draft);
  } catch (error) { return error instanceof Error ? error.message : "Invalid month."; }
  return undefined;
}
function assertRevisions(loaded: BaseState, remote: BaseState) {
  if (!remote.draft || loaded.draft?._rev !== remote.draft._rev || (loaded.published?._rev??null) !== (remote.published?._rev??null))
    throw new DraftConflict("Draft or published revision changed. Reload and review before publication.");
}
function documentReferences(document: MonthDocument) {
  const refs=new Map<string,string>();
  function add(id:string,type:string) { if(refs.has(id)&&refs.get(id)!==type)throw new Error("Conflicting reference type.");refs.set(id,type); }
  for (const entry of document.entries) {
    if(entry.specialPoster)add(entry.specialPoster.image.asset._ref,"sanity.imageAsset");
    for(const session of entry.sessions) {
      if(session.photo)add(session.photo.asset._ref,"sanity.imageAsset");
      if(session.speaker)add(session.speaker._ref,"lectureSpeaker");
      if(session.sourceRule)add(session.sourceRule._ref,"lectureRule");
    }
  }
  return refs;
}
async function validateReferences(client: SanityClient, document: MonthDocument) {
  const refs=documentReferences(document);
  for(const [id,type] of refs) {
    const resolved=await client.getDocument(id);
    if(!resolved||resolved._type!==type)throw new Error("Unresolved or invalid reference: "+id);
  }
  return [...refs.keys()].sort();
}
export async function preparePublication(client: SanityClient, loaded: BaseState, year: number, month: number, validate: (document: MonthDocument)=>Promise<void>): Promise<PublicationPlan> {
  assertLectureClient(client);
  const reason=publicationEligibility(loaded,year,month,false);if(reason)throw new Error(reason);
  const remote=await readBase(client,year,month);assertRevisions(loaded,remote);
  if(stableJson(publicationContent(loaded.draft!))!==stableJson(publicationContent(remote.draft!)))throw new DraftConflict("Draft content changed. Reload for review.");
  const document=remote.draft!;validateMonthDocument(document);
  await validate(document);const references=await validateReferences(client,document);
  const fresh=await readBase(client,year,month);assertRevisions(remote,fresh);
  if(stableJson(publicationContent(fresh.draft!))!==stableJson(publicationContent(document)))throw new DraftConflict();
  const plan: Omit<PublicationPlan,"fingerprint">={
    target:LECTURE_TARGET,year,month,draftId:document._id,draftRevision:document._rev!,
    publishedId:lectureMonthDocumentId(year,month),publishedRevision:remote.published?._rev??null,
    dates:document.entries.length,sessions:document.entries.reduce((n,entry)=>n+entry.sessions.length,0),
    references,assetReferences:references.filter(id=>id.startsWith("image-")),
    contentFingerprint:await publicationDigest(publicationContent(document)),
    payload:{...publicationContent(document),_id:document._id},
    validation:{schema:"passed",references:"resolved"},
    expected:{draft:"absent",published:"exact-reviewed-content-with-new-server-revision",assetMutations:0,otherDocumentMutations:0},
  };
  return {...plan,fingerprint:await publicationDigest(plan)};
}
export function publicationActions(plan: PublicationPlan): Action[] {
  const publish:Action={actionType:"sanity.action.document.publish",draftId:plan.draftId,publishedId:plan.publishedId,ifDraftRevisionId:plan.draftRevision,...(plan.publishedRevision?{ifPublishedRevisionId:plan.publishedRevision}:{})};
  // Existing draft is ignored; concurrent published-target creation fails atomically.
  // The publish action itself removes the draft. No manual delete/discard.
  return plan.publishedRevision ? [publish] : [{actionType:"sanity.action.document.create",publishedId:plan.publishedId,attributes:{_id:plan.draftId,_type:"lectureMonth"},ifExists:"ignore"},publish];
}
const inFlight=new WeakMap<SanityClient,Set<string>>();
export async function publishReviewedMonth(client: SanityClient, plan: PublicationPlan, confirmedFingerprint: string, validate: (document: MonthDocument)=>Promise<void>): Promise<LoadedMonth> {
  assertLectureClient(client);
  const {fingerprint,...unsigned}=plan;
  if(!confirmedFingerprint||confirmedFingerprint!==fingerprint||await publicationDigest(unsigned)!==fingerprint)throw new Error("Explicit confirmation of the exact publication plan is required.");
  const locks=inFlight.get(client)??new Set<string>();inFlight.set(client,locks);
  if(locks.has(plan.draftId))throw new Error("Publication is already in progress.");
  locks.add(plan.draftId);
  try {
    const base=await readBase(client,plan.year,plan.month);
    const reason=publicationEligibility(base,plan.year,plan.month,false);if(reason)throw new DraftConflict(reason);
    if(base.draft!._rev!==plan.draftRevision||(base.published?._rev??null)!==plan.publishedRevision)throw new DraftConflict();
    const current=await preparePublication(client,base,plan.year,plan.month,validate);
    if(current.fingerprint!==fingerprint)throw new DraftConflict("Reviewed publication payload changed. No publication performed.");
    // Last authenticated guard after schema/reference validation, immediately before the action.
    const fresh=await readBase(client,plan.year,plan.month);assertRevisions(base,fresh);
    if(fresh.draft!._id!==plan.draftId||fresh.draft!.year!==plan.year||fresh.draft!.month!==plan.month||await publicationDigest(publicationContent(fresh.draft!))!==plan.contentFingerprint)throw new DraftConflict();
    let responseError:unknown;
    try {
      const response=await client.action(publicationActions(plan));
      const result=response as typeof response & {results?:{status?:string;error?:unknown}[]};
      if(!result.transactionId||result.results?.some(r=>r.status==="error"||r.error))responseError=new Error("Action acknowledgement was not successful.");
    } catch(error) {
      if((error as {statusCode?:number}).statusCode===409)throw new DraftConflict("Publication revision conflict. The reviewed draft was not published by this action.");
      responseError=error;
    }
    // An acknowledgement alone is never success. Read-back also handles a lost response.
    try {
      const after=await readBase(client,plan.year,plan.month);
      if(after.draft||!after.published?._rev||after.published._rev===plan.publishedRevision||await publicationDigest(publicationContent(after.published))!==plan.contentFingerprint)
        throw new PublicationUncertain("Publication read-back does not match the approved plan. Reload for review; no automatic retry or rollback.");
      const loaded=await loadMonth(client,plan.year,plan.month);
      if(loaded.base.draft||loaded.base.published?._rev!==after.published._rev||await publicationDigest(publicationContent(loaded.base.published!))!==plan.contentFingerprint)throw new PublicationUncertain();
      return {...loaded,warning:[loaded.warning,responseError?"Published content verified by authenticated read-back; the action response was unavailable or invalid.":undefined].filter(Boolean).join(" ")||undefined};
    } catch(error) {
      if(error instanceof PublicationUncertain)throw error;
      throw new PublicationUncertain(undefined,{cause:error});
    }
  } finally { locks.delete(plan.draftId); }
}
