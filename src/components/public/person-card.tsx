import Image from "next/image";
import { publicAssets } from "@/lib/public-content/assets";
import type { OrganisationSlot } from "@/lib/public-content/organisation";
import styles from "./person-card.module.css";

/** One card per role slot; people holding two roles keep both mapped portraits. */
export function PersonCard({
  slot,
  prominent = false,
  reserveAppointment = false,
}: {
  slot: OrganisationSlot;
  prominent?: boolean;
  reserveAppointment?: boolean;
}) {
  const photo = slot.photoId ? publicAssets[slot.photoId] : null;
  const vacant = slot.status === "vacant";
  const role = vacant ? slot.role.replace(/\s*\(Kosong\)$/, "") : slot.role;

  return (
    <article
      className={`${styles.card} ${prominent ? styles.prominent : ""}`}
      data-slot-id={slot.id}
      aria-labelledby={`${slot.id}-name`}
    >
      <div className={styles.portrait}>
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes={prominent ? "(max-width: 599px) 108px, 168px" : "(max-width: 599px) 94px, 132px"}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.placeholderMark}>{vacant ? "—" : "□"}</span>
            <span>{vacant ? "Kosong" : "Foto belum tersedia"}</span>
          </div>
        )}
      </div>
      <div className={styles.details}>
        <h4 className={styles.name} id={`${slot.id}-name`}>
          {vacant ? "Kosong" : slot.name}
        </h4>
        <p className={styles.role}>{role}</p>
        {reserveAppointment || slot.appointment ? (
          <p className={styles.appointment}>{slot.appointment}</p>
        ) : null}
      </div>
    </article>
  );
}
