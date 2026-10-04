export const lecturePrototypeTypes = new Set(["lectureSpeaker", "lectureRule", "lectureMonth"]);

export const lectureSessionTypes = [
  { title: "Kuliah Subuh", value: "subuh" },
  { title: "Kuliah Maghrib", value: "maghrib" },
  { title: "Tazkirah Jumaat", value: "jumaat" },
  { title: "Bacaan Yasin & Tahlil", value: "yasin" },
];

export const lectureWeekdays = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
export const lectureOccurrences = ["Setiap minggu", "Pertama", "Kedua", "Ketiga", "Keempat", "Kelima"];
export const lectureMonths = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

// Operational Studio vocabulary is separate from the Malay poster vocabulary.
export const lectureEditorMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const lectureEditorWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const lectureEditorOccurrences = ["Every week", "First", "Second", "Third", "Fourth", "Fifth"];
