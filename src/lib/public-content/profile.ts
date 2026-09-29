/** Kandungan tempatan Fasa 3.1; UI dan integrasi CMS belum dibina. */
import type { PublicAssetId } from "./assets";

export interface MosqueProfile {
  readonly source: string;
  readonly name: string;
  readonly introduction: {
    readonly heading: string;
    readonly paragraphs: readonly string[];
    readonly sourceNote: string;
  };
  readonly vision: string;
  readonly mission: string;
  readonly motto: string;
  readonly logo: {
    readonly assetId: PublicAssetId;
    readonly heading: string;
    readonly paragraphs: readonly string[];
  };
  readonly spacePhotoIds: readonly PublicAssetId[];
}

export const profile = {
  "source": "profile/profile-masjid.md",
  "name": "Masjid Talhah Bin Ubaidillah",
  "introduction": {
    "heading": "Pengenalan Latar Belakang Pembangunan Masjid — Pengenalan Masjid Talhah Bin Ubaidillah",
    "paragraphs": [
      "Masjid Talhah Bin Ubaidillah dinamakan sempena seorang sahabat Rasulullah SAW yang mulia iaitu Talhah Bin Ubaidillah. Beliau terkenal dengan berani, sifat pemurah, dermawan dan gemar membelanjakan hartanya pada jalan Allah SWT sehingga akhir hayatnya. Talhah Bin Ubaidillah juga merupakan salah seorang daripada 10 orang sahabat yang dijamin syurga (Al-'Asyarah Al-Mubashsharah) oleh Rasulullah SAW kerana keimanan, pengorbanan dan jasa besar mereka dalam memperjuangkan Islam.",
      "Masjid ini terletak di Taman Alam Sutera dan berada di bawah pentadbiran Jabatan Agama Islam Wilayah Persekutuan melalui Pejabat Pusat Pentadbiran Masjid dan Surau Zon 5, Bahagian Pengurusan Masjid. Masjid Talhah bin Ubaidillah telah dibuka secara rasmi dengan pelaksanaan Solat Jumaat pertama pada 4 September 2015 bersamaan 20 Zulkaedah 1436H. Solat Jumaat bersejarah tersebut telah dihadiri oleh YB. Mejar Jeneral Dato' Seri Jamil Khir bin Haji Baharom (B) merangkap Menteri Di Jabatan Perdana Menteri (Agama). Turut hadir Ybhg. Dato' Haji Othman bin Mustapha, Ketua Pengarah Jabatan Kemajuan Islam Malaysia (JAKIM) dan YBhg. Tuan Haji Paimuzi bin Yahya, Pengarah Jabatan Agama Islam Wilayah Persekutuan (JAWI).",
      "Kapasiti Masjid Talhah Bin Ubaidillah boleh memuatkan kira-kira 2,000 jemaah pada satu-satu masa dan berfungsi sebagai pusat ibadah, pendidikan, kebajikan serta pembangunan komuniti setempat. Dengan reka bentuk yang moden dan selesa, masjid ini menyediakan pelbagai kemudahan bagi memenuhi keperluan masyarakat.",
      "Seiring dengan peranan masjid sebagai pusat pembangunan ummah, Masjid Talhah bin Ubaidillah bukan sahaja menjadi tempat menunaikan ibadah, malah berfungsi sebagai pusat penyatuan masyarakat melalui pelbagai aktiviti keilmuan, kebajikan, kesihatan dan sosial yang memberi manfaat kepada penduduk sekitar Bukit Jalil dan kawasan sekitarnya."
    ],
    "sourceNote": "Sumber: papan tanda (signboard) \"Sejarah Masjid — Pengenalan Latar Belakang Pembangunan Masjid\", Masjid Talhah Bin Ubaidillah, Bukit Jalil, Kuala Lumpur."
  },
  "vision": "Berperanan Sebagai Pusat Ibadah Yang Unggul Dari Segi Pengimarahan Dan Pembangunan Modal Insan Ke Arah Melahirkan Ummah Yang Bertaqwa, Berilmu Dan Berakhlak Mulia.",
  "mission": "Melaksanakan Pengurusan Masjid Yang Berkualiti Bagi Merealisasikan Penghayatan Islam Sebagai Ad-Din Melalui Aktiviti Pengimarahan, Dakwah Dan Memberikan Khidmat Fardhu Ain Serta Fardhu Kifayah Untuk Masyarakat Setempat.",
  "motto": "MENGIMARAHKAN MASJID TANGGUNGJAWAB BERSAMA",
  "logo": {
    "assetId": "mosque-logo",
    "heading": "Rasional Logo Masjid Talhah Bin 'Ubaidillah, Alam Sutera, Bukit Jalil, Kuala Lumpur",
    "paragraphs": [
      "Rekabentuk logo dihasilkan bagi menggambarkan identiti dan imej korporat Masjid Talhah Bin 'Ubaidillah Bukit Jalil, Alam Sutera, Kuala Lumpur serta memberi gambaran mengenai peranan, fungsi dan tanggungjawabnya.",
      "Beberapa elemen diterapkan dalam penghasilan logo. Elemen utama adalah bentuk Kubah Masjid Talhah Bin 'Ubaidillah yang digambarkan secara kontras. Ia secara jelas memaparkan keindahan rupa masjid yang tersergam indah dan cukup dikenali masyarakat umum. Imej ini juga melambangkan peranan dan tanggungjawab dalam memastikan kesucian masjid sentiasa dipelihara dari segi kebersihan, keindahan bangunan, landskap dan sebagainya.",
      "Elemen seterusnya ialah bentuk berwarna kuning di bahagian dalam Kubah iaitu simplifikasi imej 7 Muslim sedang berjemaah iaitu simbol Solat Berjemaah didirikan di masjid ini secara Istiqomah yang menjadi kekuatan Ummah dalam masyarakat. Imej ini mencerminkan peranan pihak Masjid Talhah Bin 'Ubaidillah yang aktif dan progresif dalam program dan aktiviti dakwah yang dapat mengimarahkan masjid serta mengembangkan syiar Islam. Ia juga menjelaskan lagi peranan masjid ini sebagai sebuah pusat perkembangan ilmu.",
      "Imej bulatan Kubah sebagai latar belakang membawa maksud sifat muafakat dan kerjasama dalam memelihara dan mengimarahkan masjid. Ia juga menggambarkan peranan masjid ini bukan setakat untuk beribadat, tetapi sebagai sebuah institusi yang berupaya menyatupadukan umat Islam. Dua warna dipadankan dalam ciptaan logo. Biru mencerminkan sifat muafakat, perpaduan dan kerjasama. Manakala warna kuning membawa maksud sifat dinamik dan progresif dalam melaksanakan peranan dan tanggungjawab Masjid sebagai SYIAR ISLAM."
    ]
  },
  "spacePhotoIds": [
    "interior-dewan-solat-utama",
    "interior-foyer-02",
    "interior-kubah-interior",
    "interior-mihrab",
    "interior-sudut-bacaan"
  ]
} as const satisfies MosqueProfile;
