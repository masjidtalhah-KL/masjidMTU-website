export function report(plan, validation, dataset) {
  const lines = ["# Fasa 4.3A — Laporan dry-run", "", "Mod: DRY-RUN. Tiada upload, mutation atau publish.", "", "Target: " + plan.target.projectId + "/" + plan.target.dataset, "Fingerprint pelan: " + plan.fingerprint, "", "## Dokumen"];
  const counts = {};
  for (const document of plan.documents) counts[document._type] = (counts[document._type] || 0) + 1;
  lines.push("| Schema | Bilangan |", "| --- | ---: |");
  for (const [type, count] of Object.entries(counts)) lines.push("| " + type + " | " + count + " |");
  const surau = plan.documents.filter((document) => document._type === "surau");
  const gallery = plan.documents.find((document) => document._type === "galleryCollection");
  lines.push("", "Jumlah: " + plan.documents.length + ". Organisasi " + counts.organisationMember + " slot; surau " + surau.filter((document) => document.category === "jumaat").length + " Jumaat + " + surau.filter((document) => document.category === "biasa").length + " Biasa; galeri " + (gallery?.items.length ?? 0) + " foto.", "",
    "Aset unik: " + plan.assets.length + "; penggunaan: " + plan.assetUses.length + "; aset hilang: " + plan.missing.length + ".",
    "Validation errors: " + validation.errors.length + "; warnings: " + validation.warnings.length + "; ID collisions: " + plan.collisions.length + ".",
    "Validation reference: " + validation.references + ".", "", "## Dataset");
  if (!dataset.inspected) lines.push("Belum diperiksa. Jalankan --inspect-dataset atau gunakan --dataset-snapshot yang diaudit. Ini bukan pengesahan tiada konflik.");
  else {
    lines.push("Diperiksa: " + dataset.observedAt + "; visibility: " + dataset.visibility + ".", "Jumlah rekod: " + dataset.total + "; konflik: " + dataset.conflicts.length + "; aset sumber boleh digunakan semula: " + dataset.reusedAssets + ".");
    for (const [type, count] of Object.entries(dataset.counts)) lines.push("- " + type + ": " + count);
  }
  lines.push("", "## Audit pemetaan dokumen", "", "| Sumber | ID tetap | ID draft | Tindakan |", "| --- | --- | --- | --- |");
  for (const mapping of plan.mappings) lines.push("| " + mapping.source + " | " + mapping.documentId + " | " + mapping.draftId + " | " + (dataset.actions.find((action) => action.documentId === mapping.documentId)?.action || "belum diperiksa") + " |");
  lines.push("", "## Audit aset", "", "| Fail production | Wujud | Format / bait | Pemilik / medan |", "| --- | --- | --- | --- |");
  for (const asset of plan.assets) for (const use of asset.uses) lines.push("| " + asset.localPath + " | " + asset.exists + " | " + (asset.format || "?") + " / " + (asset.size ?? "?") + " | " + use.documentId + " / " + use.field + " |");
  lines.push("", "## Dikecualikan");
  for (const skipped of plan.skipped) lines.push("- " + skipped);
  lines.push("", "## Keputusan pemetaan");
  for (const note of plan.notes) lines.push("- " + note);
  lines.push("", "## Kegagalan / konflik");
  for (const failure of [...validation.errors, ...validation.warnings, ...plan.missing, ...dataset.conflicts]) lines.push("- " + JSON.stringify(failure));
  if (!validation.errors.length && !validation.warnings.length && !plan.missing.length && !dataset.conflicts.length) lines.push("Tiada pada pemeriksaan yang dijalankan.");
  lines.push("", "Strategi kelak: cipta draft sahaja → review Studio → publish selepas kelulusan berasingan. Rerun skip payload sama; konflik menghentikan semua document writes. Tiada replace/delete/purge.", "");
  return lines.join("\n");
}
