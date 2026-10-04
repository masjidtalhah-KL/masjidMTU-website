"use client";

import { useEffect, useRef } from "react";
import { lectureMonths } from "./model";
import type { PublicationPlan } from "./publication";
import styles from "./generator.module.css";

export function PublishConfirmation({plan,busy,onConfirm,onCancel}:{plan:PublicationPlan;busy:boolean;onConfirm:()=>void;onCancel:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
  return <dialog ref={ref} className={styles.publishDialog} aria-labelledby="lecture-confirm-title" aria-describedby="lecture-confirm-description" aria-busy={busy} onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}>
    <h2 id="lecture-confirm-title">Publish Jadual {lectureMonths[plan.month-1]} {plan.year}?</h2>
    <p id="lecture-confirm-description">The reviewed saved draft will become the published Sanity CMS version. This does not launch a public Kuliah page or homepage lecture feed. No local edits will be saved automatically.</p>
    <dl><dt>Dates / sessions</dt><dd>{plan.dates} dates / {plan.sessions} sessions</dd>
      <dt>Draft revision</dt><dd>{plan.draftRevision}</dd>
      <dt>Published version</dt><dd>{plan.publishedRevision ? `Replace revision ${plan.publishedRevision}` : "None — first publication"}</dd>
      <dt>Image assets</dt><dd>{plan.assetReferences.length} resolved references; no uploads</dd>
      <dt>Content identity</dt><dd>{plan.contentFingerprint}</dd></dl>
    <p>The draft revision and content will be checked again immediately before publication. A conflict stops the action.</p>
    <div className={styles.actions}><button type="button" autoFocus disabled={busy} onClick={onCancel}>Cancel</button><button type="button" className={styles.primary} disabled={busy} onClick={onConfirm}>{busy?"Publishing…":"Confirm Publish Jadual"}</button></div>
  </dialog>;
}
