"use client";

import { useMemo } from "react";
import { useClient, useCurrentUser, useWorkspace, validateDocument } from "sanity";
import type { SanityDocument } from "@sanity/client";
import { LectureGeneratorTool } from "./LectureGeneratorTool";
import { loadMonth, prepareSave, saveDraft, type DraftAdapter } from "./draft-persistence";
import { preparePublication, publishReviewedMonth } from "./publication";

/** Only mounted by the authenticated Studio tool. No private/write environment token. */
export function StudioLectureGenerator() {
  const studioClient = useClient({ apiVersion: "2026-09-01" });
  const user = useCurrentUser();
  const workspace = useWorkspace();
  const adapter = useMemo<DraftAdapter>(() => {
    const client = studioClient.withConfig({ perspective: "raw", useCdn: false, maxRetries: 0 });
    async function validate(document: import("./month-document").MonthDocument, planned: string[] = []) {
      // A not-yet-created draft has no server timestamps/revision; validation uses its content.
      const markers = await validateDocument({ workspace: { ...workspace, getClient: () => client }, document: document as unknown as SanityDocument,
        getDocumentExists: async ({ id }) => planned.includes(id) || !!await client.getDocument(id), environment: "studio" });
      const errors = markers.filter(marker => marker.level === "error");
      if (errors.length) throw new Error(errors.map(marker => `${marker.path.join(".")}: ${marker.message}`).join("\n"));
    }
    return {
      load: (year, month) => loadMonth(client, year, month),
      prepare: async (...args) => { const prepared = await prepareSave(client, ...args); await validate(prepared.plan.payload, prepared.plan.assets.map(a => a.assetId)); return prepared; },
      save: (prepared, base) => saveDraft(client, prepared, base, (document, uploaded) => validate(document, uploaded ? [] : prepared.plan.assets.map(a => a.assetId))),
      preparePublication: (base, year, month) => preparePublication(client, base, year, month, validate),
      publish: (plan, confirmation) => publishReviewedMonth(client, plan, confirmation, validate),
    };
  }, [studioClient, workspace]);
  if (!user) return <p role="status">Sign in to Studio to load and prepare a Jadual draft.</p>;
  return <LectureGeneratorTool persistence={adapter}/>;
}
