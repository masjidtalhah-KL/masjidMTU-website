// SPDX-License-Identifier: GPL-3.0-only
// Adapted geometry/compact calendar from JadualKuliahBulanan, commit 378b1bb.
// React/SVG adaptation: 2026-10-01. See docs/third-party/JADUAL-KULIAH-NOTICE.md.
import { calendarOffset, daysInMonth } from "./poster-model";

export const POSTER = { width: 1240, height: 877, left: 34, top: 238, gridWidth: 1172, gridHeight: 621, columnGap: 13, rowGap: 9 } as const;
export const POSTER_FONTS = { title: '"Arial Black", Arial, sans-serif', topic: '"Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif', name: "Arial, sans-serif" };
export type PosterCell = { day: number; span: number };
export type TextStyle = { size: number; family: string; weight?: number; italic?: boolean };
export type MeasureText = (text: string, style: TextStyle) => number;

export const POSTER_WEEKDAYS = ["ISNIN", "SELASA", "RABU", "KHAMIS", "JUMAAT", "SABTU", "AHAD"] as const;
export const WEEKDAY_HEADER = { y: 201, height: 28, size: 27, weight: 900, letterSpacing: -1.1 } as const;
/** Centre the painted glyph bounds, rather than a fixed baseline or font advance. */
export function weekdayLabelPosition(x: number, width: number, metrics?: Pick<TextMetrics, "actualBoundingBoxLeft" | "actualBoundingBoxRight" | "actualBoundingBoxAscent" | "actualBoundingBoxDescent">) {
  const middle = WEEKDAY_HEADER.y + WEEKDAY_HEADER.height / 2;
  return metrics ? { x: x + width / 2 - (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2, y: middle + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2, anchor: "start" as const }
    : { x: x + width / 2, y: middle + 10, anchor: "middle" as const };
}

/** Shared coordinates for the SVG artwork and its native HTML date buttons. */
export function posterCellRects(year: number, month: number, compact = true, gridHeight: number = POSTER.gridHeight) {
  const layout = posterMonthCells(year, month, compact);
  const column = (POSTER.gridWidth - POSTER.columnGap * 6) / 7;
  const row = (gridHeight - POSTER.rowGap * (layout.rows - 1)) / layout.rows;
  let position = 0;
  const cells = layout.cells.map((cell) => {
    const value = { ...cell, x: POSTER.left + position % 7 * (column + POSTER.columnGap), y: POSTER.top + Math.floor(position / 7) * (row + POSTER.rowGap), width: cell.span * column + (cell.span - 1) * POSTER.columnGap, height: row };
    position += cell.span;
    return value;
  });
  return { cells, rows: layout.rows, height: POSTER.height + gridHeight - POSTER.gridHeight };
}

/** Pick only actual rendered no-date groups; compact mode never reserves raw offsets. */
export function infaqPlacement(layout: ReturnType<typeof posterCellRects>) {
  const leadingIndex = layout.cells.findIndex((cell, index) => cell.day === 0 && layout.cells[index + 1]?.day === 1);
  const trailingIndex = layout.cells.at(-1)?.day === 0 ? layout.cells.length - 1 : -1;
  const leading = leadingIndex >= 0 ? layout.cells[leadingIndex].span : 0;
  const trailing = trailingIndex >= 0 ? layout.cells[trailingIndex].span : 0;
  if (leading < 2 && trailing < 2) return { leading, trailing, panel: undefined };
  const edge = leading >= 2 && leading >= trailing ? "leading" as const : "trailing" as const;
  const index = edge === "leading" ? leadingIndex : trailingIndex;
  return { leading, trailing, panel: { edge, index, cell: layout.cells[index] } };
}

/** Balanced horizontal content inside a white merged no-date group. */
export function infaqGeometry(width: number, height: number) {
  const column = (POSTER.gridWidth - POSTER.columnGap * 6) / 7;
  const contentWidth = Math.min(width, 3 * column + 2 * POSTER.columnGap);
  const qrSize = Math.min(116, height - 16, contentWidth * .33);
  const left = (width - contentWidth) / 2 + 8;
  return { left, qrSize, qrY: (height - qrSize) / 2, textX: left + qrSize + 14, textWidth: contentWidth - qrSize - 30, contentWidth };
}

/** Only the small-screen editing view gains vertical room; print/export geometry stays fixed. */
export function editingGridHeight(year: number, month: number, compact: boolean, viewportWidth: number): number {
  if (viewportWidth <= 0) return POSTER.gridHeight;
  const rows = posterMonthCells(year, month, compact).rows;
  // Include a subpixel margin so the browser's rounded boxes remain at least 44px tall.
  return Math.max(POSTER.gridHeight, rows * 44.5 * POSTER.width / viewportWidth + POSTER.rowGap * (rows - 1));
}

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
