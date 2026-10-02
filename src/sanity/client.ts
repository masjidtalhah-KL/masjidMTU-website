import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Token-free base client. The server-only public read layer owns published reads and caching. */
export const client = createClient({ projectId, dataset, apiVersion, useCdn: true });
