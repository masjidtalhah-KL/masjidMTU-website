"use client";

import { useEffect, useRef, useState } from "react";
import { LecturePoster } from "./LecturePoster";
import { editingGridHeight, posterCellRects, POSTER } from "./poster-layout";
import { lectureMonths, type MonthSchedule, type PosterSettings, type Speaker } from "./model";
import styles from "./generator.module.css";

export function InteractiveLecturePoster({ schedule, speakers, settings, selectedDay, onSelectDay }: { schedule: MonthSchedule; speakers: Speaker[]; settings: PosterSettings; selectedDay: number; onSelectDay: (day: number) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  const compact = settings.compactCalendar ?? true;
  const gridHeight = editingGridHeight(schedule.year, schedule.month, compact, width);
  const layout = posterCellRects(schedule.year, schedule.month, compact, gridHeight);
  return <div className={styles.posterFrame}>
    <div ref={frame} className={styles.interactivePoster}>
      <LecturePoster schedule={schedule} speakers={speakers} settings={settings} gridHeight={gridHeight}/>
      <div className={styles.dateButtons} style={{ aspectRatio: `${POSTER.width} / ${layout.height}` }} role="group" aria-label="Select a poster date cell to edit">
        {layout.cells.filter(({ day }) => day > 0).sort((a, b) => a.day - b.day).map((cell) => {
          const entry = schedule.entries.find(({ day }) => day === cell.day);
          const label = `${cell.day} ${lectureMonths[schedule.month - 1]} ${schedule.year}, ${entry?.sessions.length ?? 0} sessions${entry?.specialPoster ? ", special program poster; preserved sessions hidden" : ""}${entry?.isManualOverride ? ", manual" : ""}`;
          return <button key={cell.day} type="button" className={styles.dateCell} data-date-cell={cell.day} aria-label={label} aria-pressed={selectedDay === cell.day} aria-controls="lecture-selected-day" onClick={() => onSelectDay(cell.day)} style={{ left: `${cell.x / POSTER.width * 100}%`, top: `${cell.y / layout.height * 100}%`, width: `${cell.width / POSTER.width * 100}%`, height: `${cell.height / layout.height * 100}%` }}><span className={styles.srOnly}>Edit date {cell.day}</span></button>;
        })}
      </div>
    </div>
  </div>;
}
