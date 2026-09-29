/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
import type { PublicAssetId } from "./assets";

export const gallerySource = "interior/interior.md";

export const galleryCategories = [
  { id: "interior", label: "Interior Masjid" },
] as const;

export interface GalleryPhoto {
  readonly id: string;
  readonly assetId: PublicAssetId;
  readonly category: (typeof galleryCategories)[number]["id"];
  readonly room: string;
  readonly caption: string;
  readonly order: number;
  /** Nombor rujukan dalam interior.md/contact sheet sumber. */
  readonly sourceIndex: number;
}

export const galleryPhotos = [
  {
    "id": "gallery-interior-08",
    "assetId": "interior-dewan-solat-utama",
    "category": "interior",
    "room": "Dewan Solat",
    "caption": "Pandangan luas dewan solat",
    "order": 1,
    "sourceIndex": 8
  },
  {
    "id": "gallery-interior-04",
    "assetId": "interior-dewan-solat-aerial-02",
    "category": "interior",
    "room": "Dewan Solat",
    "caption": "Pandangan udara dewan solat",
    "order": 2,
    "sourceIndex": 4
  },
  {
    "id": "gallery-interior-05",
    "assetId": "interior-dewan-solat-sisi",
    "category": "interior",
    "room": "Dewan Solat",
    "caption": "Sudut sisi dewan solat",
    "order": 3,
    "sourceIndex": 5
  },
  {
    "id": "gallery-interior-06",
    "assetId": "interior-dewan-solat-saf-depan",
    "category": "interior",
    "room": "Dewan Solat",
    "caption": "Bahagian saf depan",
    "order": 4,
    "sourceIndex": 6
  },
  {
    "id": "gallery-interior-09",
    "assetId": "interior-dewan-solat-pandangan-umum",
    "category": "interior",
    "room": "Dewan Solat",
    "caption": "Pandangan am dewan solat",
    "order": 5,
    "sourceIndex": 9
  },
  {
    "id": "gallery-interior-02",
    "assetId": "interior-kaligrafi-dewan-solat",
    "category": "interior",
    "room": "Decoration Dewan Solat",
    "caption": "Dekorasi dewan solat",
    "order": 6,
    "sourceIndex": 2
  },
  {
    "id": "gallery-interior-15",
    "assetId": "interior-kubah-interior",
    "category": "interior",
    "room": "Kubah",
    "caption": "Kubah dari dalam",
    "order": 7,
    "sourceIndex": 15
  },
  {
    "id": "gallery-interior-17",
    "assetId": "interior-mihrab",
    "category": "interior",
    "room": "Mihrab",
    "caption": "Mihrab masjid",
    "order": 8,
    "sourceIndex": 17
  },
  {
    "id": "gallery-interior-10",
    "assetId": "interior-foyer-01",
    "category": "interior",
    "room": "Foyer",
    "caption": "Foyer masjid",
    "order": 9,
    "sourceIndex": 10
  },
  {
    "id": "gallery-interior-11",
    "assetId": "interior-foyer-02",
    "category": "interior",
    "room": "Foyer",
    "caption": "Suasana foyer masjid",
    "order": 10,
    "sourceIndex": 11
  },
  {
    "id": "gallery-interior-14",
    "assetId": "interior-foyer-05",
    "category": "interior",
    "room": "Foyer",
    "caption": "Foyer masjid",
    "order": 11,
    "sourceIndex": 14
  },
  {
    "id": "gallery-interior-19",
    "assetId": "interior-sudut-bacaan",
    "category": "interior",
    "room": "Sudut Bacaan",
    "caption": "Sudut bacaan / perpustakaan mini",
    "order": 12,
    "sourceIndex": 19
  }
] as const satisfies readonly GalleryPhoto[];
