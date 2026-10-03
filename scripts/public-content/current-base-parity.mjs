import assert from "node:assert/strict";
import { resolveImages, equal } from "../sanity-migration/plan.mjs";

/** Call only alongside strict runtime and full schema validation of populated extensions. */
export function assertCurrentBaseParity(plan, inventory, ids) {
  const historicalTypes = new Set(plan.documents.map((d) => d._type));
  assert.equal(inventory.filter((d) => historicalTypes.has(d._type)).length, 43, "Unexpected additional historical-scope records");
  const extensions = ["ncrService", "donationInfo"];
  for (const document of plan.documents) {
    const actual = inventory.find((d) => d._id === document._id);
    const payload = Object.fromEntries(Object.entries(actual ?? {}).filter(([k]) => !["_createdAt", "_updatedAt", "_rev"].includes(k)));
    // Only these declared, separately validated current extensions may differ.
    // Unknown settings fields and all other historical content fail exact comparison.
    const basePayload = document._type === "siteSettings" ? Object.fromEntries(Object.entries(payload).filter(([k]) => !extensions.includes(k))) : payload;
    assert.ok(equal(resolveImages(document, ids), basePayload), "Unexpected historical base change: " + document._id);
  }
}
