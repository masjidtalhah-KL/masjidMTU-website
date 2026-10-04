import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LecturePage } from "@/components/public/lecture-page";
import { getLecturePage } from "@/lib/public-content/lectures/server";
import {
  monthLabel,
  publicMonthKey,
} from "@/lib/public-content/lectures/content";
export const revalidate = 300;
type Props = { params: Promise<{ month: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  if (!publicMonthKey(month)) return { title: "Jadual Kuliah" };
  return {
    title: `Jadual Kuliah ${monthLabel(month)}`,
    description: `Jadual kuliah dan pengajian Masjid Talhah Bin Ubaidillah untuk ${monthLabel(month)}. Lihat jadual rasmi dan muat turun poster.`,
  };
}
export default async function Page({ params }: Props) {
  const { month } = await params;
  const state = await getLecturePage(month);
  if (state.status === "not-found") notFound();
  return <LecturePage state={state} />;
}
