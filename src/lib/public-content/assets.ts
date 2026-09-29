/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
export interface PublicAsset {
  readonly id: string;
  /** URL relatif kepada public/, sesuai untuk next/image. */
  readonly src: `/${string}`;
  readonly alt: string;
  readonly category: "brand" | "interior" | "person" | "surau-logo";
  readonly context: readonly string[];
  readonly width: number;
  readonly height: number;
  /** Rujukan relatif dalam folder sumber; bukan dependency runtime. */
  readonly source: string;
}

export const publicAssets = {
  "mosque-logo": {
    "id": "mosque-logo",
    "src": "/brand/logo-masjid.png",
    "alt": "Logo rasmi Masjid Talhah Bin Ubaidillah",
    "category": "brand",
    "context": [
      "/profil"
    ],
    "width": 400,
    "height": 400,
    "source": "profile/logo-masjid.png"
  },
  "interior-dewan-solat-utama": {
    "id": "interior-dewan-solat-utama",
    "src": "/interior/dewan-solat-utama.webp",
    "alt": "Pandangan luas dewan solat — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/profil",
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/dewan-solat-wide.jpg"
  },
  "interior-dewan-solat-aerial-02": {
    "id": "interior-dewan-solat-aerial-02",
    "src": "/interior/dewan-solat-aerial-02.webp",
    "alt": "Pandangan udara dewan solat — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/dewan-solat-aerial2.jpg"
  },
  "interior-dewan-solat-sisi": {
    "id": "interior-dewan-solat-sisi",
    "src": "/interior/dewan-solat-sisi.webp",
    "alt": "Sudut sisi dewan solat — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/dewan-solat-angle-tepi.jpg"
  },
  "interior-dewan-solat-saf-depan": {
    "id": "interior-dewan-solat-saf-depan",
    "src": "/interior/dewan-solat-saf-depan.webp",
    "alt": "Bahagian saf depan — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/dewan-solat-safdepan.jpg"
  },
  "interior-dewan-solat-pandangan-umum": {
    "id": "interior-dewan-solat-pandangan-umum",
    "src": "/interior/dewan-solat-pandangan-umum.webp",
    "alt": "Pandangan am dewan solat — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/dewan-solat.jpg"
  },
  "interior-kaligrafi-dewan-solat": {
    "id": "interior-kaligrafi-dewan-solat",
    "src": "/interior/kaligrafi-dewan-solat.webp",
    "alt": "Dekorasi dewan solat — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/decoration-dewansolat2.jpg"
  },
  "interior-kubah-interior": {
    "id": "interior-kubah-interior",
    "src": "/interior/kubah-interior.webp",
    "alt": "Kubah dari dalam — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/profil",
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/interior-kubah.jpg"
  },
  "interior-mihrab": {
    "id": "interior-mihrab",
    "src": "/interior/mihrab.webp",
    "alt": "Mihrab masjid — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/profil",
      "/galeri"
    ],
    "width": 1333,
    "height": 2000,
    "source": "interior/mihrab.jpg"
  },
  "interior-foyer-01": {
    "id": "interior-foyer-01",
    "src": "/interior/foyer-01.webp",
    "alt": "Foyer masjid — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/foyer-masjid.jpg"
  },
  "interior-foyer-02": {
    "id": "interior-foyer-02",
    "src": "/interior/foyer-02.webp",
    "alt": "Suasana foyer masjid — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/profil",
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/foyer-masjid2.jpg"
  },
  "interior-foyer-05": {
    "id": "interior-foyer-05",
    "src": "/interior/foyer-05.webp",
    "alt": "Foyer masjid — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/foyer-masjid5.jpg"
  },
  "interior-sudut-bacaan": {
    "id": "interior-sudut-bacaan",
    "src": "/interior/sudut-bacaan.webp",
    "alt": "Sudut bacaan / perpustakaan mini — Masjid Talhah Bin Ubaidillah",
    "category": "interior",
    "context": [
      "/profil",
      "/galeri"
    ],
    "width": 2000,
    "height": 1333,
    "source": "interior/sudut-bacaan-putakamini.jpg"
  },
  "person-ajk-pengerusi": {
    "id": "person-ajk-pengerusi",
    "src": "/people/ajk/pengerusi-abd-aziz-ali.webp",
    "alt": "Abd Aziz Bin Ali — Pengerusi",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/PENGERUSI-ABD-AZIZ-ALI.png"
  },
  "person-ajk-setiausaha": {
    "id": "person-ajk-setiausaha",
    "src": "/people/ajk/setiausaha-wan-abd-halim.webp",
    "alt": "Wan Abd Halim Bin Md Yusoff — Setiausaha",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/SETIAUSAHA-WAN-ABD-HALIM.png"
  },
  "person-ajk-bendahari": {
    "id": "person-ajk-bendahari",
    "src": "/people/ajk/bendahari-nik-muhammad-fadlan.webp",
    "alt": "Nik Muhammad Fadlan Bin Nik Mahmood — Bendahari",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/BENDAHARI-NIK-MUHAMMAD-FADLAN.png"
  },
  "person-ajk-belia": {
    "id": "person-ajk-belia",
    "src": "/people/ajk/ajk-belia-mohd-safwan.webp",
    "alt": "Mohd Safwan Bin Abd Rahman — Ahli Jawatankuasa (Belia)",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-BELIA-MOHD-SAFWAN.png"
  },
  "person-ajk-beliawanis": {
    "id": "person-ajk-beliawanis",
    "src": "/people/ajk/ajk-beliawanis-muniroh.webp",
    "alt": "Muniroh Binti Abdul Rahim — Ahli Jawatankuasa (Beliawanis)",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-BELIAWANIS-MUNIROH.png"
  },
  "person-ajk-biro-01": {
    "id": "person-ajk-biro-01",
    "src": "/people/ajk/ajk-zaidatul-hasnida.webp",
    "alt": "Zaidatul Hasnida Binti Zakaria — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-ZAIDATUL-HASNIDA.png"
  },
  "person-ajk-biro-02": {
    "id": "person-ajk-biro-02",
    "src": "/people/ajk/ajk-farah-farhan.webp",
    "alt": "Farah Farhan Binti Zulkafli — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-FARAH-FARHAN.png"
  },
  "person-ajk-biro-03": {
    "id": "person-ajk-biro-03",
    "src": "/people/ajk/ajk-mazlan-mahmud.webp",
    "alt": "Mazlan Bin Mahmud — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-MAZLAN-MAHMUD.png"
  },
  "person-ajk-biro-04": {
    "id": "person-ajk-biro-04",
    "src": "/people/ajk/ajk-mohd-shamsuddin.webp",
    "alt": "Mohd Shamsuddin Bin Talib — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-MOHD-SHAMSUDDIN.png"
  },
  "person-ajk-biro-05": {
    "id": "person-ajk-biro-05",
    "src": "/people/ajk/ajk-mohd-hafizie.webp",
    "alt": "Mohd Hafizie Bin Nasir — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-MOHD-HAFIZIE.png"
  },
  "person-ajk-biro-06": {
    "id": "person-ajk-biro-06",
    "src": "/people/ajk/ajk-mohd-faizul-hizam.webp",
    "alt": "Mohd Faizul Hizam Bin Deraman — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-MOHD-FAIZUL-HIZAM.png"
  },
  "person-ajk-biro-08": {
    "id": "person-ajk-biro-08",
    "src": "/people/ajk/ajk-md-halim-omar.webp",
    "alt": "Md Halim Bin Omar — Ahli Jawatankuasa",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/ajk/AJK-MD-HALIM-OMAR.png"
  },
  "person-imam-01": {
    "id": "person-imam-01",
    "src": "/people/pegawai-masjid/imam/imam-faris.webp",
    "alt": "Faris Mifzal Bin Yusani — Imam",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/imam/IMAM-FARIS.png"
  },
  "person-imam-02": {
    "id": "person-imam-02",
    "src": "/people/pegawai-masjid/imam/imam-nik-muhammad-fadlan.webp",
    "alt": "Nik Muhammad Fadlan Bin Nik Mahmood — Imam",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/imam/IMAM-NIK-MUHAMMAD-FADLAN.png"
  },
  "person-imam-03": {
    "id": "person-imam-03",
    "src": "/people/pegawai-masjid/imam/imam-taqiyuddin.webp",
    "alt": "Muhammad Taqiyuddin Bin Mohamad Jan — Imam",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/imam/IMAM-TAQIYUDDIN.png"
  },
  "person-imam-04": {
    "id": "person-imam-04",
    "src": "/people/pegawai-masjid/imam/imam-wan-abd-halim.webp",
    "alt": "Wan Abd Halim Bin Md Yusoff — Imam",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/imam/IMAM-WAN-ABD-HALIM.png"
  },
  "person-imam-05": {
    "id": "person-imam-05",
    "src": "/people/pegawai-masjid/imam/imam-zulqurnain.webp",
    "alt": "Muhammad Zulqurnain Bin Mohamad Yusof — Imam",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/imam/IMAM-ZULQURNAIN.png"
  },
  "person-bilal-01": {
    "id": "person-bilal-01",
    "src": "/people/pegawai-masjid/bilal/bilal-roslan.webp",
    "alt": "Roslan Bin Supaat — Bilal",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/bilal/BILAL-ROSLAN.png"
  },
  "person-bilal-02": {
    "id": "person-bilal-02",
    "src": "/people/pegawai-masjid/bilal/bilal-mohd-safwan.webp",
    "alt": "Mohd Safwan Bin Abd Rahman — Bilal",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/bilal/BILAL-MOHD-SAFWAN.png"
  },
  "person-bilal-03": {
    "id": "person-bilal-03",
    "src": "/people/pegawai-masjid/bilal/bilal-sufi.webp",
    "alt": "Muhamad Raziq Sufi Bin Muhammad Nazam — Bilal",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/bilal/BILAL-SUFI.png"
  },
  "person-bilal-04": {
    "id": "person-bilal-04",
    "src": "/people/pegawai-masjid/bilal/bilal-tarmizi.webp",
    "alt": "Tarmizie Bin Zakaria — Bilal",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/bilal/BILAL-TARMIZI.png"
  },
  "person-noja-01": {
    "id": "person-noja-01",
    "src": "/people/pegawai-masjid/noja/noja-hadi.webp",
    "alt": "Abd Hadi Bin Abdullah — Noja",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/noja/NOJA-HADI.png"
  },
  "person-pembantu-tadbir-01": {
    "id": "person-pembantu-tadbir-01",
    "src": "/people/pegawai-masjid/pembantu-tadbir/pembantu-tadbir-irfan.webp",
    "alt": "Muhamad Irfan Muizz Bin Muhammad Nazam — Pembantu Tadbir",
    "category": "person",
    "context": [
      "/profil/organisasi"
    ],
    "width": 827,
    "height": 1181,
    "source": "staff/pegawai-masjid/pembantu-tadbir/PEMBANTU-TADBIR-IRFAN.png"
  },
  "logo-surau-darul-jalil": {
    "id": "logo-surau-darul-jalil",
    "src": "/surau/surau-darul-jalil.png",
    "alt": "Logo Surau Darul Jalil",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 218,
    "height": 197,
    "source": "profile/logos-surau/surau-darul-jalil.png"
  },
  "logo-surau-al-faizin": {
    "id": "logo-surau-al-faizin",
    "src": "/surau/surau-al-faizin.png",
    "alt": "Logo Surau Al-Faizin",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 228,
    "height": 184,
    "source": "profile/logos-surau/surau-al-faizin.png"
  },
  "logo-surau-al-mustaqim-ppr": {
    "id": "logo-surau-al-mustaqim-ppr",
    "src": "/surau/surau-al-mustaqim-ppr.png",
    "alt": "Logo Surau Al-Mustaqim",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 210,
    "height": 177,
    "source": "profile/logos-surau/surau-al-mustaqim-ppr.png"
  },
  "logo-surau-khalid-al-walid": {
    "id": "logo-surau-khalid-al-walid",
    "src": "/surau/surau-khalid-al-walid.png",
    "alt": "Logo Surau Khalid Al-Walid",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 262,
    "height": 231,
    "source": "profile/logos-surau/surau-khalid-al-walid.png"
  },
  "logo-surau-al-hidayah-klsc": {
    "id": "logo-surau-al-hidayah-klsc",
    "src": "/surau/surau-al-hidayah-klsc.png",
    "alt": "Logo Surau Al-Hidayah KLSC",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 246,
    "height": 246,
    "source": "profile/logos-surau/surau-al-hidayah-klsc.png"
  },
  "logo-surau-al-muttaqin": {
    "id": "logo-surau-al-muttaqin",
    "src": "/surau/surau-al-muttaqin.png",
    "alt": "Logo Surau Al-Muttaqin",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 177,
    "height": 180,
    "source": "profile/logos-surau/surau-al-muttaqin.png"
  },
  "logo-surau-al-mustaqim-ltat": {
    "id": "logo-surau-al-mustaqim-ltat",
    "src": "/surau/surau-al-mustaqim-ltat.jpeg",
    "alt": "Logo Surau Al-Mustaqim",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 235,
    "height": 209,
    "source": "profile/logos-surau/surau-al-mustaqim-ltat.jpeg"
  },
  "logo-surau-al-furqan": {
    "id": "logo-surau-al-furqan",
    "src": "/surau/surau-al-furqan.png",
    "alt": "Logo Surau Al-Furqan",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 432,
    "height": 136,
    "source": "profile/logos-surau/surau-al-furqan.png"
  },
  "logo-surau-an-nur-abc": {
    "id": "logo-surau-an-nur-abc",
    "src": "/surau/surau-an-nur-abc.png",
    "alt": "Logo Surau An-Nur ABC",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 300,
    "height": 242,
    "source": "profile/logos-surau/surau-an-nur-abc.png"
  },
  "logo-surau-al-jannah": {
    "id": "logo-surau-al-jannah",
    "src": "/surau/surau-al-jannah.png",
    "alt": "Logo Surau Al-Jannah",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 254,
    "height": 254,
    "source": "profile/logos-surau/surau-al-jannah.png"
  },
  "logo-surau-al-jalil": {
    "id": "logo-surau-al-jalil",
    "src": "/surau/surau-al-jalil.png",
    "alt": "Logo Surau Al Jalil",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 288,
    "height": 288,
    "source": "profile/logos-surau/surau-al-jalil.png"
  },
  "logo-surau-an-nur-jalil-mas": {
    "id": "logo-surau-an-nur-jalil-mas",
    "src": "/surau/surau-an-nur-jalil-mas.png",
    "alt": "Logo Surau An-Nur Jalil Mas",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 329,
    "height": 232,
    "source": "profile/logos-surau/surau-an-nur-jalil-mas.png"
  },
  "logo-surau-ar-raudhoh": {
    "id": "logo-surau-ar-raudhoh",
    "src": "/surau/surau-ar-raudhoh.jpeg",
    "alt": "Logo Surau Ar-Raudhoh",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 248,
    "height": 248,
    "source": "profile/logos-surau/surau-ar-raudhoh.jpeg"
  },
  "logo-surau-mimos": {
    "id": "logo-surau-mimos",
    "src": "/surau/surau-mimos.png",
    "alt": "Logo Surau MIMOS",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 99,
    "height": 97,
    "source": "profile/logos-surau/surau-mimos.png"
  },
  "logo-surau-mercu-jalil": {
    "id": "logo-surau-mercu-jalil",
    "src": "/surau/surau-mercu-jalil.jpeg",
    "alt": "Logo Surau Mercu Jalil",
    "category": "surau-logo",
    "context": [
      "/profil/surau-kariah"
    ],
    "width": 389,
    "height": 264,
    "source": "profile/logos-surau/surau-mercu-jalil.jpeg"
  }
} as const satisfies Record<string, PublicAsset>;

export type PublicAssetId = keyof typeof publicAssets;
