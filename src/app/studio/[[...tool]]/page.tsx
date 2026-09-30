import { NextStudio } from "next-sanity/studio";
import { metadata as studioMetadata } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-static";
export { viewport } from "next-sanity/studio";
export const metadata = {
  ...studioMetadata,
  title: { absolute: "Masjid Talhah CMS" },
  description: "Sanity Studio untuk pengurusan kandungan editorial masjid.",
};

export default function StudioPage() {
  return <NextStudio config={config} />;
}
