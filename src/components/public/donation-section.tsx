import Image from "next/image";
import { Button, Container, Heading, Section } from "@/components/design-system";
import type { DonationContent } from "@/lib/public-content/cms/information-types";
import styles from "./public-information.module.css";

export function DonationSection({ content }: { content: DonationContent }) {
  const info = content.information;
  return <Section id="donations" tone="white" className="donation-section">
    <Container width="wide">
      <div className={info ? `donation-panel ${styles.withQr}` : "donation-panel"}>
        <div className="donation-panel__content">
          <p className="eyebrow eyebrow--gold">Salurkan sumbangan anda</p>
          <Heading as="h2">{info?.heading ?? "Sumbangan yang menguatkan khidmat komuniti."}</Heading>
          {info ? info.copy.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className={index > 0 ? styles.reminder : undefined}>{paragraph}</p>) : <p>Sumbangan menyokong keperluan dan aktiviti masjid. Hubungi pihak masjid untuk maklumat saluran sumbangan yang disahkan.</p>}
          {content.source === "unavailable" && <p>Maklumat saluran sumbangan tidak tersedia buat sementara waktu.</p>}
          <Button href="#contact" size="lg">Hubungi pihak masjid</Button>
        </div>
        {info ? <figure className={styles.qr}>
          <Image src={info.primaryQr.src} alt={info.primaryQr.alt} width={info.primaryQr.width} height={info.primaryQr.height} unoptimized />
          <figcaption>{info.recipientLabel}</figcaption>
          <a href={info.primaryQr.src} target="_blank" rel="noopener noreferrer">Buka imej QR<span className={styles.srOnly}> dalam tab baharu</span></a>
        </figure> : <div className="donation-panel__aside" aria-hidden="true">
          <span>IKHLAS</span><i /><strong>Khidmat<br />bersama</strong>
        </div>}
      </div>
    </Container>
  </Section>;
}
