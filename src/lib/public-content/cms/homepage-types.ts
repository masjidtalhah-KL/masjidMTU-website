export type HomepageAnnouncement = {
  id: string;
  title: string;
  description: string;
  date: string;
  cta: { label: string; url: string } | null;
};

export type HomepageProgram = {
  scheduleType: "scheduled" | "ongoing";
  id: string;
  title: string;
  description: string;
  category: string | null;
  date: string;
  time: string | null;
};

export type HomepageNews = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  date: string;
};

export type HomepageEditorial = {
  source: "sanity" | "unavailable";
  announcement: HomepageAnnouncement | null;
  programs: HomepageProgram[];
  news: HomepageNews[];
};
