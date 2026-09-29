/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
import type { PublicAssetId } from "./assets";

export const organisationSource = "staff/staff.md";

export const organisationGroups = [
  {
    "id": "jawatankuasa-utama",
    "label": "Jawatankuasa Utama",
    "parent": "Ahli Jawatankuasa Kariah",
    "order": 1
  },
  {
    "id": "ajk-biro",
    "label": "Biro-Biro Masjid",
    "parent": "Ahli Jawatankuasa Kariah",
    "order": 2
  },
  {
    "id": "imam",
    "label": "Imam",
    "parent": "Pegawai Masjid",
    "order": 3
  },
  {
    "id": "bilal",
    "label": "Bilal",
    "parent": "Pegawai Masjid",
    "order": 4
  },
  {
    "id": "noja",
    "label": "Noja",
    "parent": "Pegawai Masjid",
    "order": 5
  },
  {
    "id": "pembantu-tadbir",
    "label": "Pembantu Tadbir",
    "parent": "Pegawai Masjid",
    "order": 6
  }
] as const;

export type OrganisationGroupId = (typeof organisationGroups)[number]["id"];

export interface OrganisationSlot {
  /** ID slot jawatan; kekal apabila pemegang jawatan bertukar. */
  readonly id: string;
  readonly groupId: OrganisationGroupId;
  readonly name: string | null;
  readonly role: string;
  readonly appointment: string | null;
  readonly status: "occupied" | "vacant";
  /** null + occupied: placeholder neutral; null + vacant: tiada foto/nama. */
  readonly photoId: PublicAssetId | null;
  readonly order: number;
}

export const organisationSlots = [
  {
    "id": "ajk-pengerusi",
    "groupId": "jawatankuasa-utama",
    "name": "Abd Aziz Bin Ali",
    "role": "Pengerusi",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-pengerusi",
    "order": 1
  },
  {
    "id": "ajk-timbalan-pengerusi",
    "groupId": "jawatankuasa-utama",
    "name": null,
    "role": "Timbalan Pengerusi (Kosong)",
    "appointment": null,
    "status": "vacant",
    "photoId": null,
    "order": 2
  },
  {
    "id": "ajk-setiausaha",
    "groupId": "jawatankuasa-utama",
    "name": "Wan Abd Halim Bin Md Yusoff",
    "role": "Setiausaha",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-setiausaha",
    "order": 3
  },
  {
    "id": "ajk-bendahari",
    "groupId": "jawatankuasa-utama",
    "name": "Nik Muhammad Fadlan Bin Nik Mahmood",
    "role": "Bendahari",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-bendahari",
    "order": 4
  },
  {
    "id": "ajk-belia",
    "groupId": "ajk-biro",
    "name": "Mohd Safwan Bin Abd Rahman",
    "role": "Ahli Jawatankuasa (Belia)",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-belia",
    "order": 1
  },
  {
    "id": "ajk-beliawanis",
    "groupId": "ajk-biro",
    "name": "Muniroh Binti Abdul Rahim",
    "role": "Ahli Jawatankuasa (Beliawanis)",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-beliawanis",
    "order": 2
  },
  {
    "id": "ajk-biro-01",
    "groupId": "ajk-biro",
    "name": "Zaidatul Hasnida Binti Zakaria",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-01",
    "order": 3
  },
  {
    "id": "ajk-biro-02",
    "groupId": "ajk-biro",
    "name": "Farah Farhan Binti Zulkafli",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-02",
    "order": 4
  },
  {
    "id": "ajk-biro-03",
    "groupId": "ajk-biro",
    "name": "Mazlan Bin Mahmud",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-03",
    "order": 5
  },
  {
    "id": "ajk-biro-04",
    "groupId": "ajk-biro",
    "name": "Mohd Shamsuddin Bin Talib",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-04",
    "order": 6
  },
  {
    "id": "ajk-biro-05",
    "groupId": "ajk-biro",
    "name": "Mohd Hafizie Bin Nasir",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-05",
    "order": 7
  },
  {
    "id": "ajk-biro-06",
    "groupId": "ajk-biro",
    "name": "Mohd Faizul Hizam Bin Deraman",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-06",
    "order": 8
  },
  {
    "id": "ajk-biro-07",
    "groupId": "ajk-biro",
    "name": "Soffan Affendi Bin Aminudin",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": null,
    "order": 9
  },
  {
    "id": "ajk-biro-08",
    "groupId": "ajk-biro",
    "name": "Md Halim Bin Omar",
    "role": "Ahli Jawatankuasa",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-ajk-biro-08",
    "order": 10
  },
  {
    "id": "imam-01",
    "groupId": "imam",
    "name": "Faris Mifzal Bin Yusani",
    "role": "Imam",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-imam-01",
    "order": 5
  },
  {
    "id": "imam-02",
    "groupId": "imam",
    "name": "Nik Muhammad Fadlan Bin Nik Mahmood",
    "role": "Imam",
    "appointment": "Pen. Peg. Hal Ehwal Islam (S5)",
    "status": "occupied",
    "photoId": "person-imam-02",
    "order": 2
  },
  {
    "id": "imam-03",
    "groupId": "imam",
    "name": "Muhammad Taqiyuddin Bin Mohamad Jan",
    "role": "Imam",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-imam-03",
    "order": 3
  },
  {
    "id": "imam-04",
    "groupId": "imam",
    "name": "Wan Abd Halim Bin Md Yusoff",
    "role": "Imam",
    "appointment": "Pegawai Hal Ehwal Islam (S9)",
    "status": "occupied",
    "photoId": "person-imam-04",
    "order": 1
  },
  {
    "id": "imam-05",
    "groupId": "imam",
    "name": "Muhammad Zulqurnain Bin Mohamad Yusof",
    "role": "Imam",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-imam-05",
    "order": 4
  },
  {
    "id": "bilal-01",
    "groupId": "bilal",
    "name": "Roslan Bin Supaat",
    "role": "Bilal",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-bilal-01",
    "order": 3
  },
  {
    "id": "bilal-02",
    "groupId": "bilal",
    "name": "Mohd Safwan Bin Abd Rahman",
    "role": "Bilal",
    "appointment": "Pem. Hal Ehwal Islam (S1)",
    "status": "occupied",
    "photoId": "person-bilal-02",
    "order": 1
  },
  {
    "id": "bilal-03",
    "groupId": "bilal",
    "name": "Muhamad Raziq Sufi Bin Muhammad Nazam",
    "role": "Bilal",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-bilal-03",
    "order": 4
  },
  {
    "id": "bilal-04",
    "groupId": "bilal",
    "name": "Tarmizie Bin Zakaria",
    "role": "Bilal",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-bilal-04",
    "order": 2
  },
  {
    "id": "noja-01",
    "groupId": "noja",
    "name": "Abd Hadi Bin Abdullah",
    "role": "Noja",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-noja-01",
    "order": 1
  },
  {
    "id": "pembantu-tadbir-01",
    "groupId": "pembantu-tadbir",
    "name": "Muhamad Irfan Muizz Bin Muhammad Nazam",
    "role": "Pembantu Tadbir",
    "appointment": null,
    "status": "occupied",
    "photoId": "person-pembantu-tadbir-01",
    "order": 1
  }
] as const satisfies readonly OrganisationSlot[];
