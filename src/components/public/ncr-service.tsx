import Image from "next/image";
import { Container, Heading, Section } from "@/components/design-system";
import type { NcrService } from "@/lib/public-content/cms/information-types";
import styles from "./public-information.module.css";

export function NcrServiceView({ information }: { information: NcrService }) {
  return <Section id="nikah-cerai-ruju" tone="white" className={styles.service}>
    <Container width="wide">
      <Heading as="h2">{information.heading}</Heading>
      <p className={styles.introduction}>{information.introduction}</p>
      <ul className={styles.officers}>
        {information.officers.map((officer) => <li key={officer.name}>
          <Heading as="h3">{officer.name}</Heading>
          <p>{officer.role}</p>
          <a href={officer.phone.href} aria-label={`Telefon ${officer.name}: ${officer.phone.label}`}>{officer.phone.label}</a>
        </li>)}
      </ul>
      {information.poster && <figure className={styles.poster}>
        <Image src={information.poster.src} alt={information.poster.alt} width={information.poster.width} height={information.poster.height} unoptimized />
        <figcaption>Poster maklumat perkhidmatan</figcaption>
      </figure>}
    </Container>
  </Section>;
}
