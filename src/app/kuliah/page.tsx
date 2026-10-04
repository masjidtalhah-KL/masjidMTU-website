import type { Metadata } from "next";
import { LecturePage } from "@/components/public/lecture-page";
import { getLecturePage } from "@/lib/public-content/lectures/server";
export const revalidate = 300;
export const metadata: Metadata = {
  title: "Jadual Kuliah",
  description:
    "Jadual kuliah dan pengajian bulanan Masjid Talhah Bin Ubaidillah, Bukit Jalil. Lihat jadual rasmi dan muat turun poster.",
};
export default async function Page() {
  return <LecturePage state={await getLecturePage()} />;
}
