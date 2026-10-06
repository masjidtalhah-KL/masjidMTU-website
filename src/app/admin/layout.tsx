import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-root" lang="en">{children}</div>;
}
