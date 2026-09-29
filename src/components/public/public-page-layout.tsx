import type { ReactNode } from "react";
import { Card, Container, Footer, Navbar, Section } from "@/components/design-system";
import { PublicPageHeader } from "./public-page-header";
import type { PublicPageHeaderProps } from "./public-page-header";

/** Shared shell for Phase 3 pages; homepage keeps its approved composition. */
export function PublicPageLayout({
  children,
  ...headerProps
}: PublicPageHeaderProps & { children: ReactNode }) {
  return (
    <div className="public-page-layout">
      <Navbar variant="public" />
      <main className="public-page-main">
        <PublicPageHeader {...headerProps} />
        <Section tone="ivory" className="public-page-body">
          <Container width="wide">
            <Card className="public-page-placeholder">{children}</Card>
          </Container>
        </Section>
      </main>
      <Footer variant="public" />
    </div>
  );
}
