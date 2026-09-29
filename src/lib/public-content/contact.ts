/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
export interface ContactDetails {
  readonly source: string;
  readonly addressLines: readonly string[];
  readonly phone: { readonly label: string; readonly href: `tel:${string}` };
  readonly email: { readonly label: string; readonly href: `mailto:${string}` };
  readonly facebook: { readonly href: `https://${string}` };
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
  "officeHours": [
    {
      "days": "Isnin – Jumaat",
      "hours": "9:00 pagi – 5:00 petang"
    }
  ]
} as const satisfies ContactDetails;
