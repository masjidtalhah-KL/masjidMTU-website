import { siteSettings } from "./siteSettings";
import { announcement } from "./announcement";
import { program } from "./program";
import { lectureSpeaker } from "./lectureSpeaker";
import { lectureRule } from "./lectureRule";
import { lectureMonth, lectureDay, lectureSession } from "./lectureMonth";
import { newsPost } from "./newsPost";
import { profilePage } from "./profilePage";
import { organisationMember } from "./organisationMember";
import { surau } from "./surau";
import { galleryCollection } from "./galleryCollection";
import { editorialImage } from "./editorialImage";
import { galleryMedia } from "./galleryMedia";
import { blockContent, paragraphText } from "./blockContent";

export const schemaTypes = [
  siteSettings, profilePage, announcement, program, newsPost,
  organisationMember, surau, galleryCollection,
  lectureSpeaker, lectureRule, lectureMonth, lectureDay, lectureSession,
  editorialImage, galleryMedia, blockContent, paragraphText,
];
