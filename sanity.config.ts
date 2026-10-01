"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { singletonTypes } from "./src/sanity/singletons";
import { structure } from "./src/sanity/structure";
import { lecturePrototypeTypes } from "./src/sanity/lecture-types";
import { LectureGeneratorIcon, LectureGeneratorTool } from "./src/sanity/tools/lecture-generator";

const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Masjid Talhah CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  tools: [{ name: "penjana-jadual-kuliah", title: "Penjana Jadual Kuliah", icon: LectureGeneratorIcon, component: LectureGeneratorTool }],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType) && !lecturePrototypeTypes.has(schemaType)),
  },
  document: {
    actions: (actions, context) => lecturePrototypeTypes.has(context.schemaType) ? [] : singletonTypes.has(context.schemaType)
      ? actions.filter(({ action }) => action && singletonActions.has(action))
      : actions,
    newDocumentOptions: (options) => options.filter(({ templateId }) => !singletonTypes.has(templateId) && !lecturePrototypeTypes.has(templateId)),
  },
});
