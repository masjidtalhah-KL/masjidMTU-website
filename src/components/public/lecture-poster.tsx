"use client";
import { useEffect, useRef, useState } from "react";
import { LecturePoster } from "@/sanity/tools/lecture-generator/LecturePoster";
import { defaultPosterSettings } from "@/sanity/tools/lecture-generator/poster-model";
import type { PublicLectureMonth } from "@/lib/public-content/lectures/content";
import { publicPosterFetchUrl } from "@/lib/public-content/lectures/images";
import styles from "./public-lectures.module.css";
export function PublicLecturePoster({ month }: { month: PublicLectureMonth }) {
  const holder = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null),
    busy = useRef(false);
  const [open, setOpen] = useState(false),
    [ready, setReady] = useState(false),
    [exporting, setExporting] = useState(false),
    [message, setMessage] = useState("");
  const settings = {
    ...defaultPosterSettings,
    reviewMode: "official" as const,
    reviewLabel: "",
    paper: "A4" as const,
    showInfaq: month.showInfaq,
    generalDonationQr: month.compactQr,
  };
  useEffect(() => {
    const update = () => {
      const svg = holder.current?.querySelector("svg[data-lecture-poster]");
      setReady(
        svg?.getAttribute("data-fonts-ready") === "true" &&
          !svg.getAttribute("data-overflow"),
      );
    };
    const observer = new MutationObserver(update);
    if (holder.current)
      observer.observe(holder.current, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-fonts-ready", "data-overflow"],
      });
    update();
    return () => observer.disconnect();
  }, [month]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  async function download(format: "png" | "pdf") {
    if (busy.current || !ready) return;
    busy.current = true;
    setExporting(true);
    setMessage("");
    try {
      const svg = holder.current?.querySelector<SVGSVGElement>(
        "svg[data-lecture-poster]",
      );
      if (!svg) throw new Error("Missing poster");
      const { exportPoster } =
        await import("@/sanity/tools/lecture-generator/export-poster");
      await exportPoster(
        svg,
        format,
        `jadual-kuliah-${month.key}`,
        "A4",
        "https://cdn.sanity.io/images/2o95jmms/production/",
        {
          reviewOnly: false,
          assetFetchUrl: (href) => publicPosterFetchUrl(href, month.key),
        },
      );
      setMessage(`Jadual ${format.toUpperCase()} telah dimuat turun.`);
    } catch (error) {
      console.error("[public-lectures] Poster download failed.", error);
      setMessage(
        "Muat turun tidak berjaya. Sila cuba lagi atau hubungi pihak masjid.",
      );
    } finally {
      busy.current = false;
      setExporting(false);
    }
  }
  const artwork = (
    <LecturePoster
      schedule={month.schedule}
      speakers={[]}
      settings={settings}
    />
  );
  return (
    <>
      <div ref={holder} className={styles.poster}>
        {artwork}
      </div>
      <div className={styles.actions}>
        <button
          className="button button--primary"
          disabled={!ready || exporting}
          onClick={() => download("png")}
        >
          {exporting ? "Sedang menyediakan…" : "Muat turun PNG"}
        </button>
        <button
          className="button button--outline"
          disabled={!ready || exporting}
          onClick={() => download("pdf")}
        >
          Muat turun PDF
        </button>
        <button className="button button--ghost" onClick={() => setOpen(true)}>
          Buka poster penuh <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className={styles.hint}>
        Poster landskap tanpa potongan. Buka poster penuh untuk melihat butiran
        dengan lebih jelas.
      </p>
      {message ? (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      ) : null}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="full-poster-title"
        onCancel={() => setOpen(false)}
      >
        <div className={styles.dialogHeader}>
          <h2 id="full-poster-title">Jadual Kuliah {month.label}</h2>
          <button
            className="button button--outline"
            onClick={() => {
              dialog.current?.close();
              setOpen(false);
            }}
          >
            Tutup
          </button>
        </div>
        <p>Geser poster untuk melihat keseluruhan jadual.</p>
        <div
          className={styles.fullPoster}
          role="region"
          aria-label="Poster penuh. Gunakan kekunci arah untuk melihat butiran."
          tabIndex={0}
        >
          {open ? artwork : null}
        </div>
      </dialog>
    </>
  );
}
