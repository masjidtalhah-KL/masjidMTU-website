import Link from "next/link";
import { Container, Heading } from "@/components/design-system";

export type Breadcrumb = {
  label: string;
  href?: string;
};

export type PublicPageHeaderProps = {
  title: string;
  eyebrow?: string;
  introduction?: string;
  breadcrumbs?: readonly Breadcrumb[];
};

export function PublicPageHeader({
  title,
  eyebrow,
  introduction,
  breadcrumbs,
}: PublicPageHeaderProps) {
  return (
    <header className="public-page-header">
      <Container width="wide">
        {breadcrumbs?.length ? (
          <nav className="public-breadcrumb" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map(({ label, href }, index) => (
                <li key={`${index}-${label}`}>
                  {index > 0 ? <span className="public-breadcrumb__separator" aria-hidden="true">/</span> : null}
                  {href ? (
                    <Link href={href}>{label}</Link>
                  ) : (
                    <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <p className="eyebrow eyebrow--gold">{eyebrow}</p> : null}
        <Heading as="h1">{title}</Heading>
        {introduction ? <p className="public-page-header__intro">{introduction}</p> : null}
      </Container>
    </header>
  );
}
