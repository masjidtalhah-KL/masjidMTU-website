import Image from "next/image";
import { Container, Heading, Section } from "@/components/design-system";
import type { ContactDetails } from "@/lib/public-content/contact";
import { NcrServiceView } from "./ncr-service";
import styles from "./contact-details.module.css";

// Heroicons outline, MIT © Tailwind Labs. See docs/third-party/HEROICONS-LICENSE.txt.
const iconPaths = {
  address: ["M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z", "M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"],
  phone: ["M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"],
  email: ["M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"],
  social: ["M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"],
};

function ContactLabel({ icon, label }: { icon: keyof typeof iconPaths; label: string }) {
  return <dt><svg className={styles.contactIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" focusable="false">{iconPaths[icon].map((d) => <path key={d} d={d} strokeLinecap="round" strokeLinejoin="round" />)}</svg><span className={styles.srOnly}>{label}</span></dt>;
}

function SocialLink({ platform, href }: { platform: "facebook" | "instagram"; href: string }) {
  const label = platform === "facebook" ? "Facebook" : "Instagram";
  return (
    <a className={styles.socialLink} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${label} rasmi masjid dalam tab baharu`} title={label}>
      <span className={styles.socialIcon}>
        <Image className={styles.socialBlack} src={`/social/${platform}-black.png`} width={32} height={32} alt="" unoptimized />
        <Image className={styles.socialColor} src={`/social/${platform}-color.png`} width={32} height={32} alt="" unoptimized />
      </span>
    </a>
  );
}

function Address({ lines }: { lines: readonly string[] }) {
  return (
    <address className={styles.address}>
      {lines.map((line) => <span key={line}>{line}</span>)}
    </address>
  );
}

/** Presentation accepts local content or a future CMS mapping. */
export function ContactDetailsView({ details }: { details: ContactDetails }) {
  const mapQuery = encodeURIComponent(details.addressLines.join(", "));
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <>
      <Section tone="ivory" className={styles.informationSection}>
        <Container width="wide">
          <div className={styles.informationLayout}>
            <div className={styles.information}>
              <Heading className={styles.informationHeading}>Hubungi kami</Heading>
              <dl className={styles.details}>
                <div className={styles.detailRow}>
                  <ContactLabel icon="address" label="Alamat" />
                  <dd><Address lines={details.addressLines} /></dd>
                </div>
                <div className={styles.detailRow}>
                  <ContactLabel icon="phone" label="Telefon" />
                  <dd>
                    <a className={styles.actionLink} href={details.phone.href} aria-label={`Telefon masjid: ${details.phone.label}`}>
                      {details.phone.label}
                    </a>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <ContactLabel icon="email" label="Emel" />
                  <dd>
                    <a className={styles.actionLink} href={details.email.href} aria-label={`Emel masjid: ${details.email.label}`}>
                      {details.email.label}
                    </a>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <ContactLabel icon="social" label="Media sosial" />
                  <dd className={styles.socialLinks}>
                    <SocialLink platform="facebook" href={details.facebook.href} />
                    <SocialLink platform="instagram" href={details.instagram.href} />
                  </dd>
                </div>
              </dl>
            </div>

            <aside className={styles.hoursPanel} aria-labelledby="office-hours-title">
              <span className={styles.hoursRule} aria-hidden="true" />
              <h2 id="office-hours-title" className={styles.hoursHeading}>Waktu Pejabat</h2>
              <div className={styles.hoursList}>
                {details.officeHours.map(({ days, hours }) => (
                  <div className={styles.hoursRow} key={days}>
                    <p className={styles.hoursDays}>{days}</p>
                    <p className={styles.hoursTime}>{hours}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {details.ncrService && <NcrServiceView information={details.ncrService} />}

      <Section tone="navy" className={styles.locationSection}>
        <Container width="wide" className={styles.locationLayout}>
          <div>
            <Heading className={styles.locationHeading}>Lokasi</Heading>
            <Address lines={details.addressLines} />
          </div>
          <a
            className={styles.mapLink}
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Cari alamat masjid di Google Maps dalam tab baharu"
          >
            Cari alamat di Google Maps<span aria-hidden="true">↗</span>
          </a>
        </Container>
      </Section>
    </>
  );
}
