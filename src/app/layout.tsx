import type { Metadata } from "next";
import { AppRouteLayout } from "@/components/app-route-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Masjid Talhah Bin Ubaidillah",
    template: "%s | Masjid Talhah Bin Ubaidillah",
  },
  description:
    "Website rasmi Masjid Talhah Bin Ubaidillah, Bukit Jalil, Kuala Lumpur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ms">
      <body><AppRouteLayout>{children}</AppRouteLayout></body>
    </html>
  );
}
