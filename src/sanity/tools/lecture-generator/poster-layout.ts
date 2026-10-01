// SPDX-License-Identifier: GPL-3.0-only
// Adapted geometry/compact calendar from JadualKuliahBulanan, commit 378b1bb.
// React/SVG adaptation: 2026-10-01. See docs/third-party/JADUAL-KULIAH-NOTICE.md.
import { calendarOffset, daysInMonth } from "./model";

export const POSTER = { width: 1240, height: 877, left: 34, top: 238, gridWidth: 1172, gridHeight: 621, columnGap: 13, rowGap: 9 } as const;
export const POSTER_FONTS = { title: '"Arial Black", Arial, sans-serif', topic: '"Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif', name: "Arial, sans-serif" };
export type PosterCell = { day: number; span: number };
export type TextStyle = { size: number; family: string; weight?: number; italic?: boolean };
export type MeasureText = (text: string, style: TextStyle) => number;

/** Legacy compact month layout, independent of its workspace and DOM. */
export function posterMonthCells(year: number, month: number, compact = true) {
  const offset = calendarOffset(year, month), days = daysInMonth(year, month);
  const rows = Math.ceil((offset + days) / 7), lastStart = (rows - 1) * 7 - offset + 1, lastCount = days - lastStart + 1;
  const cells: PosterCell[] = [];
  if (compact && offset > 0 && rows > 4 && lastCount <= offset) {
    for (let day = lastStart; day <= days; day++) cells.push({ day, span: 1 });
    if (offset > lastCount) cells.push({ day: 0, span: offset - lastCount });
    for (let day = 1; day < lastStart; day++) cells.push({ day, span: 1 });
    return { rows: rows - 1, cells };
  }
  if (offset) cells.push({ day: 0, span: offset });
  for (let day = 1; day <= days; day++) cells.push({ day, span: 1 });
  const trailing = rows * 7 - offset - days;
  if (trailing) cells.push({ day: 0, span: trailing });
  return { rows, cells };
}

// SSR fallback only. The mounted poster measures actual browser fonts before export.
export const approximateText: MeasureText = (text, style) => text.length * style.size * .56;

export function wrapPosterText(text: string, width: number, style: TextStyle, measure: MeasureText): string[] {
  if (!text.trim()) return [];
  return text.split(/\r?\n/).flatMap((paragraph) => {
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if (line && measure(line + word, style) > width) { lines.push(line.trimEnd()); line = ""; }
      for (const part of Array.from(word)) {
        if (measure(line + part, style) > width && line) { lines.push(line.trimEnd()); line = ""; }
        line += part;
      }
      line += " ";
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines;
  });
}

/** Keep full text; surface overflow instead of silently replacing names with ellipses. */
export function fitPosterCopy(topic: string, name: string, width: number, height: number, topicSize: number, nameSize: number, measure: MeasureText, pending = false) {
  let result;
  for (let step = 0; step <= 18; step++) {
    const topicStyle: TextStyle = { size: Math.max(8, topicSize - step * .3), family: POSTER_FONTS.topic, weight: 700, italic: !pending };
    const nameStyle: TextStyle = { size: Math.max(8, nameSize - step * .3), family: POSTER_FONTS.name, weight: 700 };
    const topicLines = wrapPosterText(topic, width, topicStyle, measure), nameLines = wrapPosterText(name.toUpperCase(), width, nameStyle, measure);
    const gap = topicLines.length && nameLines.length ? 1 : 0;
    const contentHeight = topicLines.length * topicStyle.size * 1.07 + nameLines.length * nameStyle.size * 1.02 + gap;
    result = { topicStyle, nameStyle, topicLines, nameLines, gap, contentHeight, fits: contentHeight <= height };
    if (result.fits) return result;
  }
  return result!;
}

export function fitSingleLine(text: string, width: number, style: TextStyle, measure: MeasureText, minimum = 8) {
  let size = style.size;
  while (size > minimum && measure(text, { ...style, size }) > width) size = Math.max(minimum, size - .25);
  return size;
}

/** Equivalent to object-fit/object-position; contain is the safe default. */
export function portraitBounds(photo: { width: number; height: number; fit?: "contain" | "cover"; positionY?: number; zoom?: number }, box: { x: number; y: number; width: number; height: number }) {
  const fit = photo.fit === "cover" ? Math.max : Math.min;
  const scale = fit(box.width / photo.width, box.height / photo.height) * Math.min(1.6, Math.max(1, photo.zoom ?? 1));
  const width = photo.width * scale, height = photo.height * scale;
  const position = Math.min(100, Math.max(0, photo.positionY ?? 50)) / 100;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) * position, width, height };
}
