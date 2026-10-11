"use client";
import { Button } from "@/components/design-system";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <PublicPageLayout eyebrow="Masjid Talhah Bin Ubaidillah" title="Maklumat tidak tersedia">
    <p>Maklumat tidak dapat dimuatkan sekarang. Sila cuba lagi kemudian.</p>
    <Button onClick={reset}>Cuba lagi</Button>
  </PublicPageLayout>;
}
