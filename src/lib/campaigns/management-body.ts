import { AdminError } from "@/lib/admin/policy";
export const MANAGEMENT_BODY_BYTES = 8192;
// 4 KiB config plus bounded core fields/envelope; existing smaller readers stay unchanged.
export async function readManagementBody(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) throw new AdminError(422, "invalid");
  const reader = body.getReader(), bytes = new Uint8Array(MANAGEMENT_BODY_BYTES);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > MANAGEMENT_BODY_BYTES - length) throw new AdminError(422, "invalid");
      bytes.set(value, length); length += value.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
  } catch {
    void reader.cancel().catch(() => {});
    throw new AdminError(422, "invalid");
  } finally { reader.releaseLock(); }
}
