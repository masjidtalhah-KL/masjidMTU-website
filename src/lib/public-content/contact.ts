/** Kandungan tempatan Fasa 3.1 dengan tambahan yang diluluskan dalam Fasa 3.7. */
import type { NcrService } from "./cms/information-types";

export interface ContactDetails {
  readonly ncrService?: NcrService;
  readonly source: string;
  readonly addressLines: readonly string[];
  readonly phone: { readonly label: string; readonly href: `tel:${string}` };
  readonly email: { readonly label: string; readonly href: `mailto:${string}` };
  readonly facebook: { readonly href: `https://${string}` };
  readonly instagram: { readonly href: `https://${string}` };
  readonly officeHours: readonly { readonly days: string; readonly hours: string }[];
}

export const contact = {
  "source": "hubungi.md",
  "addressLines": [
    "MASJID TALHAH BIN UBAIDILLAH",
    "TAMAN ALAM SUTERA",
    "57000 BUKIT JALIL",
    "WILAYAH PERSEKUTUAN KUALA LUMPUR"
  ],
  "phone": {
    "label": "+60 3-8074 7414",
    "href": "tel:+60380747414"
  },
  "email": {
    "label": "masjidtalhahubaidillah@gmail.com",
    "href": "mailto:masjidtalhahubaidillah@gmail.com"
  },
  "facebook": {
    "href": "https://www.facebook.com/masjidtalhahkl"
  },
  "instagram": {
    "href": "https://www.instagram.com/masjidtalhahubaidillahofficial/"
  },
  "officeHours": [
    {
      "days": "Isnin – Jumaat",
      "hours": "9:00 pagi – 5:00 petang"
    },
    {
      "days": "Sabtu, Ahad dan Cuti Umum",
      "hours": "Tutup"
    }
  ]
} as const satisfies ContactDetails;
