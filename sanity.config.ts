"use client";

import { defineConfig, type PreviewConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { galleryCategoryOptions } from "./src/sanity/schemaTypes/galleryCollection";
import { labelFor } from "./src/sanity/schemaTypes/fields";
import { singletonTypes } from "./src/sanity/singletons";
import { structure } from "./src/sanity/structure";
import { lecturePrototypeTypes } from "./src/sanity/lecture-types";
import { LectureGeneratorIcon, LectureGeneratorTool } from "./src/sanity/tools/lecture-generator";

const singletonActions = new Set(["publish", "discardChanges", "restore"]);

// Studio's nested media selection turns the observed items array into a path
// object. Select its length separately; keep the migration schema bytes intact.
const galleryListPreview: PreviewConfig = {
  select: { title: "title", category: "category", itemCount: "items.length", media: "items.0.image" },
  prepare: ({ title, category, itemCount, media }) => ({
    title: title || "Koleksi baharu",
    subtitle: `${labelFor(galleryCategoryOptions, category)} · ${typeof itemCount === "number" ? itemCount : 0} foto`,
    media,
  }),
};

export default defineConfig({
  name: "default",
  title: "Masjid Talhah CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  tools: [{ name: "penjana-jadual-kuliah", title: "Jadual Kuliah Generator", icon: LectureGeneratorIcon, component: LectureGeneratorTool }],
  schema: {
    types: schemaTypes.map((type) => type.name === "galleryCollection" ? { ...type, preview: galleryListPreview } : type),
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType) && !lecturePrototypeTypes.has(schemaType)),
  },
  document: {
    actions: (actions, context) => lecturePrototypeTypes.has(context.schemaType) ? [] : singletonTypes.has(context.schemaType)
      ? actions.filter(({ action }) => action && singletonActions.has(action))
      : actions,
    newDocumentOptions: (options) => options.filter(({ templateId }) => !singletonTypes.has(templateId) && !lecturePrototypeTypes.has(templateId)),
  },
});
