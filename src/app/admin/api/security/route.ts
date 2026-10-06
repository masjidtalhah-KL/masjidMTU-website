import { adminContext } from "@/lib/admin/dal";
import { json, failure } from "@/lib/admin/http";
export async function GET() {
  try { return json((await adminContext("security")).state); }
  catch (error) { return failure(error); }
}
