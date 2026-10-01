import type { StructureResolver } from "sanity/structure";
import { SITE_SETTINGS_ID, SITE_SETTINGS_TYPE } from "./schemaTypes/siteSettings";
import { PROFILE_PAGE_ID, PROFILE_PAGE_TYPE } from "./schemaTypes/profilePage";

export const structure: StructureResolver = (S) => S.list()
  .title("Kandungan")
  .items([
    S.listItem().id(SITE_SETTINGS_ID).title("Site Settings")
      .child(S.document().schemaType(SITE_SETTINGS_TYPE).documentId(SITE_SETTINGS_ID)),
    S.listItem().id(PROFILE_PAGE_ID).title("Profil Masjid")
      .child(S.document().schemaType(PROFILE_PAGE_TYPE).documentId(PROFILE_PAGE_ID)),
    S.divider(),
    S.documentTypeListItem("announcement").title("Pengumuman"),
    S.documentTypeListItem("program").title("Program"),
    S.documentTypeListItem("newsPost").title("Berita & Aktiviti"),
    S.divider(),
    S.documentTypeListItem("organisationMember").title("Carta Organisasi"),
    S.documentTypeListItem("surau").title("Surau Kariah"),
    S.documentTypeListItem("galleryCollection").title("Galeri"),
  ]);
