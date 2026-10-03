import { groq } from "next-sanity";

/** Fetch a stable bundle; eligibility is evaluated against the server clock after validation. */
export const homepageEditorialQuery = groq`{
  "announcements": *[_type == "announcement" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
    _id, _type, title, summary, publishedAt, expiresAt, displayOrder, isActive,
    cta{label, url}
  },
  "programs": *[_type == "program" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
    _id, _type, title, description, category, scheduleType, startAt, endAt, displayOrder, isActive
  },
  "news": *[_type == "newsPost" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
    _id, _type, title, excerpt, category, publishedAt
  }
}`;
