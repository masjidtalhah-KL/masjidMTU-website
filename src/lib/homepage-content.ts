/** Mock content for the public homepage; replace with CMS data in a later phase. */
export const prayerTimes = [
  { name: "Subuh", time: "5:58" },
  { name: "Syuruk", time: "7:08" },
  { name: "Zohor", time: "13:12" },
  { name: "Asar", time: "16:28" },
  { name: "Maghrib", time: "19:14" },
  { name: "Isyak", time: "20:23" },
] as const;

export const announcement = {
  label: "Contoh pengumuman",
  title: "Ruang makluman rasmi masjid",
  description:
    "Pengumuman yang telah disahkan oleh pihak masjid akan dipaparkan di sini untuk rujukan jemaah.",
  date: "Kandungan contoh",
} as const;

export const upcomingPrograms = [
  {
    category: "Komuniti",
    title: "Gotong-royong komuniti",
    date: "10 Okt 2026",
    time: "8:30 pagi",
    description: "Contoh program untuk menunjukkan susunan acara akan datang.",
  },
  {
    category: "Keluarga",
    title: "Bicara keluarga sakinah",
    date: "17 Okt 2026",
    time: "9:00 pagi",
    description: "Butiran program sebenar akan dikemas kini oleh pihak masjid.",
  },
  {
    category: "Pendidikan",
    title: "Kelas asas al-Quran",
    date: "24 Okt 2026",
    time: "10:00 pagi",
    description: "Contoh kandungan program, belum merupakan hebahan rasmi.",
  },
] as const;

export const lectureSchedule = [
  { date: "Isnin · 12 Okt", time: "Selepas Maghrib", title: "Tadabbur Surah al-Hujurat", speaker: "Penceramah jemputan" },
  { date: "Rabu · 14 Okt", time: "Selepas Maghrib", title: "Fiqh ibadah harian", speaker: "Penceramah jemputan" },
  { date: "Sabtu · 17 Okt", time: "9:00 pagi", title: "Sirah dan teladan", speaker: "Penceramah jemputan" },
] as const;

export const communityUpdates = [
  {
    category: "Aktiviti",
    date: "Kandungan contoh",
    title: "Sorotan program komuniti",
    description: "Ruang untuk gambar dan ringkasan program selepas maklumatnya disahkan.",
  },
  {
    category: "Berita",
    date: "Kandungan contoh",
    title: "Pengisian ilmu di masjid",
    description: "Ikuti ringkasan kuliah dan perkongsian ilmu yang diterbitkan pihak masjid.",
  },
  {
    category: "Pengumuman",
    date: "Kandungan contoh",
    title: "Makluman untuk jemaah",
    description: "Hebahan aktiviti dan maklumat penting yang telah disahkan oleh pihak masjid.",
  },
] as const;
