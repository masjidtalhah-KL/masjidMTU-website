"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { SITE_SETTINGS_TYPE } from "./src/sanity/schemaTypes/siteSettings";
import { structure } from "./src/sanity/structure";

const singletonActions = new Set(["publish", "discardChanges", "restore"]);

export default defineConfig({
  name: "default",
  title: "Masjid Talhah CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => schemaType !== SITE_SETTINGS_TYPE),
  },
  document: {
    actions: (actions, context) => context.schemaType === SITE_SETTINGS_TYPE
      ? actions.filter(({ action }) => action && singletonActions.has(action))
      : actions,
  },
});
