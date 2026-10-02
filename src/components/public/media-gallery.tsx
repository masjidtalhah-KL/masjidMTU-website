"use client";

import { PublicImage as Image } from "./public-image";
import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import styles from "./media-gallery.module.css";

/** Source-independent presentation data for local fallback and published CMS content. */
export type MediaGalleryItem = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  order: number;
  title?: string;
  caption?: string;
};

export function MediaGallery({ items }: { items: readonly MediaGalleryItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const selected = selectedIndex === null ? null : ordered[selectedIndex];

  useLayoutEffect(() => {
    if (selectedIndex !== null && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
      closeRef.current?.focus();
    }
  }, [selectedIndex]);

  function close() {
    dialogRef.current?.close();
    setSelectedIndex(null);
    openerRef.current?.focus();
  }

  function open(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setSelectedIndex(index);
  }

  function move(step: number) {
    setSelectedIndex((current) => current === null ? null : (current + step + ordered.length) % ordered.length);
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  return (
    <>
      <div className={styles.grid}>
        {ordered.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`${styles.tile} ${index === 0 ? styles.anchor : ""} ${item.height > item.width ? styles.portrait : ""}`}
            onClick={(event) => open(index, event.currentTarget)}
            aria-label={`Buka gambar: ${item.title ?? item.caption ?? item.alt}`}
            data-gallery-id={item.id}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes={index === 0 ? "(max-width: 1192px) calc(100vw - 40px), 1152px" : item.height > item.width ? "(max-width: 767px) calc(100vw - 40px), 520px" : "(max-width: 767px) calc(100vw - 40px), (max-width: 1192px) 48vw, 564px"}
              priority={index === 0}
              className={styles.thumbnail}
            />
            {item.title || item.caption ? (
              <span className={styles.caption}>
                {item.title ? <strong>{item.title}</strong> : null}
                {item.caption ? <span>{item.caption}</span> : null}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="Paparan gambar"
        onKeyDown={onDialogKeyDown}
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={() => { setSelectedIndex(null); openerRef.current?.focus(); }}
        onClick={onBackdropClick}
      >
        {selected ? (
          <div className={styles.dialogContent}>
            <div className={styles.dialogTop}>
              <span>{selectedIndex! + 1} / {ordered.length}</span>
              <button type="button" ref={closeRef} className={styles.control} onClick={close} aria-label="Tutup gambar">Tutup <span aria-hidden="true">×</span></button>
            </div>
            <div className={styles.dialogImageArea}>
              <Image
                key={selected.id}
                src={selected.src}
                alt={selected.alt}
                width={selected.width}
                height={selected.height}
                sizes="(max-width: 767px) 100vw, 90vw"
                className={styles.dialogImage}
              />
            </div>
            {selected.title || selected.caption ? (
              <p className={styles.dialogCaption}>
                {selected.title ? <strong>{selected.title}</strong> : null}
                {selected.caption ? <span>{selected.caption}</span> : null}
              </p>
            ) : null}
            <div className={styles.dialogNavigation}>
              <button type="button" className={styles.control} onClick={() => move(-1)} aria-label="Gambar sebelumnya">← Sebelumnya</button>
              <button type="button" className={styles.control} onClick={() => move(1)} aria-label="Gambar seterusnya">Seterusnya →</button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
