import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Masjid",
  description: "Website rasmi masjid sedang dibangunkan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="ms"><body>{children}</body></html>;
}
