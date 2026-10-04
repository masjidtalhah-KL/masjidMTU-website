"use client";

import { useEffect, useRef, useState } from "react";
import { DraftConflict, workingSignature, type DraftAdapter, type LoadedMonth } from "./draft-persistence";
import { publicationEligibility, PublicationUncertain, type PublicationPlan } from "./publication";
import type { MonthSchedule } from "./model";
import type { useDraftWorkflow } from "./useDraftWorkflow";

type DraftWorkflow = ReturnType<typeof useDraftWorkflow>;
type Phase = "checking" | "ready" | "disabled" | "confirming" | "publishing" | "conflict" | "error" | "uncertain";
export function usePublicationWorkflow(adapter: DraftAdapter | undefined, draft: DraftWorkflow, schedule: MonthSchedule, showInfaq: boolean) {
  const [phase, setPhase] = useState<Phase>("disabled");
  const [reason, setReason] = useState("Publication is not available in fixture/demo mode.");
  const [plan, setPlan] = useState<PublicationPlan>();
  const [confirmation, setConfirmation] = useState<PublicationPlan>();
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0), submitting = useRef(false), ticket = useRef<PublicationPlan | undefined>(undefined);
  const current = useRef({ draft, schedule, showInfaq });
  useEffect(() => { current.current={draft,schedule,showInfaq}; }, [draft,schedule,showInfaq]);
  const loaded=draft.state?.loaded, signature=workingSignature(schedule,showInfaq);
  useEffect(() => {
    const counter=generation, request=++counter.current;
    void Promise.resolve().then(async()=>{
      if(request!==counter.current)return;
      ticket.current=undefined;setConfirmation(undefined);setPlan(undefined);
      const blocked=!adapter?.preparePublication||!adapter.publish ? "Publication is not available in fixture/demo mode."
        : draft.locked||draft.phase!=="idle" ? "Finish loading/saving or reload for review."
        : publicationEligibility(loaded?.base,schedule.year,schedule.month,draft.dirty);
      if(blocked){setPhase("disabled");setReason(blocked);return;}
      setPhase("checking");setReason("Checking schema, references and remote revisions…");
      try {
        const result=await adapter!.preparePublication!(loaded!.base,schedule.year,schedule.month);
        if(request!==counter.current)return;
        setPlan(result);setReason("");setPhase("ready");
      } catch(error) {
        if(request!==counter.current)return;
        setPhase(error instanceof DraftConflict?"conflict":"error");
        setReason(error instanceof Error?error.message:"Publication validation failed.");
      }
    });
    return ()=>{counter.current++;};
  },[adapter,loaded,draft.dirty,draft.locked,draft.phase,signature,schedule.year,schedule.month,refresh]);

  async function openConfirmation() {
    if(phase!=="ready"||!plan||!adapter?.preparePublication||submitting.current)return;
    submitting.current=true;
    const request=++generation.current;
    setPhase("checking");setReason("Refreshing the reviewed publication plan…");
    try {
      const context=current.current;
      const blocked=publicationEligibility(context.draft.state?.loaded.base,context.schedule.year,context.schedule.month,context.draft.dirty);
      if(blocked)throw new Error(blocked);
      const next=await adapter.preparePublication(context.draft.state!.loaded.base,context.schedule.year,context.schedule.month);
      if(request!==generation.current)return;
      ticket.current=next;setConfirmation(next);setPlan(next);setReason("");setPhase("confirming");
    } catch(error) {
      if(request===generation.current){setPhase(error instanceof DraftConflict?"conflict":"error");setReason(error instanceof Error?error.message:"Publication validation failed.");}
    } finally{submitting.current=false;}
  }
  function cancel() {
    if(submitting.current||phase==="publishing")return;
    ticket.current=undefined;setConfirmation(undefined);setPhase("ready");
  }
  async function confirm() {
    const approved=ticket.current,context=current.current;
    if(!approved||!adapter?.publish||submitting.current||phase!=="confirming")return;
    const blocked=publicationEligibility(context.draft.state?.loaded.base,context.schedule.year,context.schedule.month,context.draft.dirty);
    if(blocked||context.draft.phase!=="idle"||context.draft.state?.loaded.base.draft?._rev!==approved.draftRevision){ticket.current=undefined;setConfirmation(undefined);setPhase("conflict");setReason(blocked||"Draft state changed after confirmation. Review again.");return;}
    // Synchronous latch + single-use ticket: a second click cannot dispatch.
    submitting.current=true;ticket.current=undefined;setPhase("publishing");setReason("Publishing Jadual… authenticated read-back is required.");
    try {
      const published:LoadedMonth=await adapter.publish(approved,approved.fingerprint);
      context.draft.acceptPublished(published);
      setConfirmation(undefined);setPlan(undefined);setReason("");setPhase("disabled");
    } catch(error) {
      setConfirmation(undefined);
      setPhase(error instanceof PublicationUncertain?"uncertain":error instanceof DraftConflict?"conflict":"error");
      setReason(error instanceof Error?error.message:"Publication failed; reload for review.");
    } finally{submitting.current=false;}
  }
  const localReason=publicationEligibility(loaded?.base,schedule.year,schedule.month,draft.dirty);
  return {phase,reason:localReason||reason,plan,confirmation,enabled:phase==="ready"&&!localReason&&!draft.locked&&draft.phase==="idle"&&plan?.draftRevision===loaded?.base.draft?._rev,locked:phase==="confirming"||phase==="publishing"||phase==="uncertain",
    openConfirmation,cancel,confirm,recheck:()=>{if(!submitting.current)setRefresh(n=>n+1);}};
}
