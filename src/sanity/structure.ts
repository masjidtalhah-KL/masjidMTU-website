import type { StructureResolver } from "sanity/structure";
import { SITE_SETTINGS_ID, SITE_SETTINGS_TYPE } from "./schemaTypes/siteSettings";

export const structure: StructureResolver = (S) => S.list()
  .title("Kandungan")
  .items([
    S.listItem().id(SITE_SETTINGS_ID).title("Site Settings")
      .child(S.document().schemaType(SITE_SETTINGS_TYPE).documentId(SITE_SETTINGS_ID)),
  ]);
