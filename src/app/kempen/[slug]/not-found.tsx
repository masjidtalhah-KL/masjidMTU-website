import { Button } from "@/components/design-system";
import { PublicPageLayout } from "@/components/public/public-page-layout";

export default function NotFound() {
  return <PublicPageLayout eyebrow="Masjid Talhah Bin Ubaidillah" title="Halaman tidak ditemukan">
    <p>Halaman ini tidak tersedia.</p><Button href="/">Kembali ke laman utama</Button>
  </PublicPageLayout>;
}
