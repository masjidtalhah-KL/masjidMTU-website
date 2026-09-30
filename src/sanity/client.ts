import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only foundation for future phases. No public page imports or queries this client yet. */
export const client = createClient({ projectId, dataset, apiVersion, useCdn: true });
