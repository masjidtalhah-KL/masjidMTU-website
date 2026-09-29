/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
import type { PublicAssetId } from "./assets";

export const surauSource = "profile/surau-kariah.md";

export const surauCategories = [
  { id: "jumaat", label: "Surau Jumaat" },
  { id: "biasa", label: "Surau Biasa" },
] as const;

export interface Surau {
  readonly id: string;
  readonly name: string;
  readonly category: (typeof surauCategories)[number]["id"];
  readonly address: string;
  readonly logoId: PublicAssetId;
  readonly order: number;
}

export const surauList = [
  {
    "id": "surau-darul-jalil",
    "name": "Surau Darul Jalil",
    "category": "jumaat",
    "address": "Apartment Sri Rakyat, Jalan 14/155C, Bandar Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-darul-jalil",
    "order": 1
  },
  {
    "id": "surau-al-faizin",
    "name": "Surau Al-Faizin",
    "category": "jumaat",
    "address": "Majlis Sukan Negara Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-al-faizin",
    "order": 2
  },
  {
    "id": "surau-al-mustaqim-ppr",
    "name": "Surau Al-Mustaqim (PPR Pinggiran Bukit Jalil)",
    "category": "jumaat",
    "address": "PPR Pinggiran Bukit Jalil Fasa 2, Jalan Bukit Jalil Indah, Bukit Jalil, 58000 Kuala Lumpur",
    "logoId": "logo-surau-al-mustaqim-ppr",
    "order": 3
  },
  {
    "id": "surau-khalid-al-walid",
    "name": "Surau Khalid Al-Walid",
    "category": "biasa",
    "address": "Sek. Sukan Bukit Jalil, Kompleks Sukan Negara, 57100 Kuala Lumpur",
    "logoId": "logo-surau-khalid-al-walid",
    "order": 1
  },
  {
    "id": "surau-al-hidayah-klsc",
    "name": "Surau Al-Hidayah KLSC",
    "category": "biasa",
    "address": "Aras 1, Stadium Nasional, Kompleks Sukan Negara, Bukit Jalil, Sri Petaling, 57700 Kuala Lumpur",
    "logoId": "logo-surau-al-hidayah-klsc",
    "order": 2
  },
  {
    "id": "surau-al-muttaqin",
    "name": "Surau Al-Muttaqin",
    "category": "biasa",
    "address": "Tingkat 2 Blok B, Vista MSN, Kompleks Sukan Negara, Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-al-muttaqin",
    "order": 3
  },
  {
    "id": "surau-al-mustaqim-ltat",
    "name": "Surau Al-Mustaqim (Taman LTAT)",
    "category": "biasa",
    "address": "F-0-5, Blok F, No. 3 Taman LTAT, Jalan Bukit Jalil Indah 4, Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-al-mustaqim-ltat",
    "order": 4
  },
  {
    "id": "surau-al-furqan",
    "name": "Surau Al-Furqan",
    "category": "biasa",
    "address": "B0-06, No. 3, Jalan Bukit Jalil Indah 1, Taman LTAT Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-al-furqan",
    "order": 5
  },
  {
    "id": "surau-an-nur-abc",
    "name": "Surau An-Nur (All Asia Broadcast Center)",
    "category": "biasa",
    "address": "All Asia Broadcast Center, Bukit Jalil, 57100 Kuala Lumpur",
    "logoId": "logo-surau-an-nur-abc",
    "order": 6
  },
  {
    "id": "surau-al-jannah",
    "name": "Surau Al-Jannah",
    "category": "biasa",
    "address": "Blok E, PPR Pinggiran Bukit Jalil, Jalan Bukit Jalil Indah, Bukit Jalil, 58000 Kuala Lumpur",
    "logoId": "logo-surau-al-jannah",
    "order": 7
  },
  {
    "id": "surau-al-jalil",
    "name": "Surau Al Jalil",
    "category": "biasa",
    "address": "Aras 6, Blok A, PPA1M Bukit Jalil, 57100 Kuala Lumpur",
    "logoId": "logo-surau-al-jalil",
    "order": 8
  },
  {
    "id": "surau-an-nur-jalil-mas",
    "name": "Surau An-Nur (Residensi Jalil Mas)",
    "category": "biasa",
    "address": "Level LG, Residensi Jalil Mas, 75 Lebuhraya Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-an-nur-jalil-mas",
    "order": 9
  },
  {
    "id": "surau-ar-raudhoh",
    "name": "Surau Ar-Raudhoh",
    "category": "biasa",
    "address": "Tingkat 6, Impiana Sky Residensi, No. 3 Jalan Bukit Jalil Indah, 57000 Kuala Lumpur",
    "logoId": "logo-surau-ar-raudhoh",
    "order": 10
  },
  {
    "id": "surau-mimos",
    "name": "Surau MIMOS",
    "category": "biasa",
    "address": "MIMOS Berhad, Jalan Inovasi 3, Mranti Park, 57000 Kuala Lumpur",
    "logoId": "logo-surau-mimos",
    "order": 11
  },
  {
    "id": "surau-mercu-jalil",
    "name": "Surau Mercu Jalil",
    "category": "biasa",
    "address": "Blok A, Aras 9, PPAM Mercu Jalil, No. 1, Jalan Jalil Impian 1, Bukit Jalil, 57000 Kuala Lumpur",
    "logoId": "logo-surau-mercu-jalil",
    "order": 12
  }
] as const satisfies readonly Surau[];
