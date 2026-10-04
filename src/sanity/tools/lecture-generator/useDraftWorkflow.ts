"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canSwitchMonth, DraftConflict, workingSignature, type DraftAdapter, type LoadedMonth, type PreparedSave } from "./draft-persistence";
import { monthKey, type MonthSchedule, type PosterSettings, type Speaker } from "./model";

type MonthState = { loaded: LoadedMonth; signature: string };
export function useDraftWorkflow(adapter: DraftAdapter | undefined, schedule: MonthSchedule, speakers: Speaker[], settings: PosterSettings,
  receive: (loaded: LoadedMonth) => void, activate: (year: number, month: number, showInfaq?: boolean) => void) {
  const [months, setMonths] = useState<Record<string, MonthState>>({});
  const [phase, setPhase] = useState<"idle" | "loading" | "saving" | "conflict" | "error">("idle");
  const [error, setError] = useState("");
  const [prepared, setPrepared] = useState<PreparedSave>();
  const [pending, setPending] = useState<{ year: number; month: number }>();
  const [review, setReview] = useState<LoadedMonth>();
  const [backup, setBackup] = useState<{ schedule: MonthSchedule; showInfaq: boolean }>();
  const key = monthKey(schedule.year, schedule.month), state = months[key];
  const signature = workingSignature(schedule, settings.showInfaq !== false);
  const dirty = !!state && signature !== state.signature;
  const locked = !!adapter && (!state || phase === "loading" || phase === "saving");
  const callbacks = useRef({ receive, activate });
  // Event handlers are current without restarting authenticated loads after every edit.
  useEffect(() => { callbacks.current = { receive, activate }; }, [receive, activate]);
  const request = useRef(0);
  const load = useCallback(async (year: number, month: number) => {
    if (!adapter) return;
    const generation = ++request.current;
    setPhase("loading"); setError(""); setPrepared(undefined); setReview(undefined);
    try {
      const loaded = await adapter.load(year, month);
      if (generation !== request.current) return;
      callbacks.current.receive(loaded);
      setMonths(previous => ({ ...previous, [monthKey(year, month)]: { loaded, signature: workingSignature(loaded.schedule, loaded.showInfaq) } }));
      setPhase("idle");
    } catch (err) { if (generation === request.current) { setError(err instanceof Error ? err.message : "Could not load the month."); setPhase("error"); } }
  }, [adapter]);
  const initial = useRef({ year: schedule.year, month: schedule.month });
  useEffect(() => {
    const counter = request; // Request generation counter, not a DOM ref.
    void load(initial.current.year, initial.current.month);
    return () => { counter.current++; };
  }, [load]);
  useEffect(() => {
    if (!adapter || !dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [adapter, dirty]);
  async function switchMonth(year: number, month: number, confirmed = false) {
    if (!adapter) { callbacks.current.activate(year, month); return; }
    if (phase === "saving" || phase === "loading") return;
    if (!canSwitchMonth(dirty, false, confirmed)) { setPending({ year, month }); return; }
    setPending(undefined); setPrepared(undefined); setError(""); setReview(undefined);
    const cached = months[monthKey(year, month)];
    if (state) setMonths(previous => ({ ...previous, [key]: { ...state, loaded: { ...state.loaded, showInfaq: settings.showInfaq !== false } } }));
    if (cached) { callbacks.current.activate(year, month, cached.loaded.showInfaq); setPhase("idle"); }
    else await load(year, month);
  }
  async function save() {
    if (!adapter || locked || !state) return;
    setPhase("saving"); setError(""); setPrepared(undefined);
    try {
      const next = await adapter.prepare(schedule, speakers, settings, state.loaded.base);
      setPrepared(next);
      const loaded = await adapter.save(next, state.loaded.base);
      callbacks.current.receive(loaded);
      setMonths(previous => ({ ...previous, [key]: { loaded, signature: workingSignature(loaded.schedule, loaded.showInfaq) } }));
      setPhase("idle");
    } catch (err) { setError(err instanceof Error ? err.message : "Save Draft failed."); setPhase(err instanceof DraftConflict ? "conflict" : "error"); }
  }
  async function reloadForReview() {
    if (!adapter || phase === "saving") return;
    setPhase("loading"); setError("");
    try { setReview(await adapter.load(schedule.year, schedule.month)); setPhase("conflict"); }
    catch (err) { setError(err instanceof Error ? err.message : "Reload failed."); setPhase("error"); }
  }
  function useRemote() {
    if (!review) return;
    setBackup({ schedule, showInfaq: settings.showInfaq !== false });
    callbacks.current.receive(review);
    setMonths(previous => ({ ...previous, [key]: { loaded: review, signature: workingSignature(review.schedule, review.showInfaq) } }));
    setPrepared(undefined); setReview(undefined); setError(""); setPhase("idle");
  }
  function acceptPublished(loaded: LoadedMonth) {
    callbacks.current.receive(loaded);
    setMonths(previous => ({ ...previous, [key]: { loaded, signature: workingSignature(loaded.schedule, loaded.showInfaq) } }));
    setPrepared(undefined); setReview(undefined); setError(""); setPhase("idle");
  }
  const status = phase === "saving" ? "Saving…" : phase === "loading" ? "Loading month…" : phase === "conflict" ? "Revision conflict — local edits preserved" : phase === "error" ? "Validation / save failed — review error" : dirty ? "Unsaved changes" : state?.loaded.base.draft ? state.loaded.saveResult === "unchanged" ? "Draft saved — no changes needed" : "Draft saved" : state?.loaded.base.published ? "Published" : "Not saved";
  return { state, status, dirty, locked, phase, error, prepared, pending, review, backup, switchMonth, cancelSwitch: () => setPending(undefined), save, reloadForReview, useRemote, acceptPublished };
}
