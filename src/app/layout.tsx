import type { Metadata } from "next";
import { PublicRouteTransition } from "@/components/public/public-route-transition";
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
      <body><PublicRouteTransition>{children}</PublicRouteTransition></body>
    </html>
  );
}
