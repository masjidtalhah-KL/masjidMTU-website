import "server-only";
import { cache } from "react";
import { client } from "../../../sanity/client";
import { lectureIndexQuery, lectureMonthQuery } from "./queries";
import { loadLecturePage } from "./content";
import { loadUpcomingLecture } from "./upcoming";
const publicClient = client.withConfig({
  perspective: "published",
  token: undefined,
  useCdn: false,
  timeout: 8000,
  maxRetries: 0,
});
const options = {
  perspective: "published" as const,
  cache: "force-cache" as const,
  next: { revalidate: 300, tags: ["public-content:lectures"] },
};
const readIndex = cache(() =>
  publicClient.fetch<unknown>(lectureIndexQuery, {}, options),
);
const readMonth = cache((month: string) =>
  publicClient.fetch<unknown>(
    lectureMonthQuery,
    { id: `lectureMonth-${month}` },
    options,
  ),
);
export const getLecturePage = cache((key?: string) =>
  loadLecturePage(readIndex, readMonth, key),
);
export const getUpcomingLecture = cache(() =>
  loadUpcomingLecture(readIndex, readMonth),
);
