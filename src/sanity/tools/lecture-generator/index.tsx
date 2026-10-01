"use client";

import { lazy, Suspense } from "react";

// Load the editor only when this tool is opened; schema/CLI inspection stays independent of CSS/browser APIs.
const Generator = lazy(() => import("./LectureGeneratorTool").then((module) => ({ default: module.LectureGeneratorTool })));

export function LectureGeneratorTool() {
  return <Suspense fallback={<p role="status" style={{ padding: 24 }}>Memuatkan penjana jadual…</p>}><Generator /></Suspense>;
}
export function LectureGeneratorIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h3M14 15h3M7 18h3"/></svg>;
}
