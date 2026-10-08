import { AdminError } from "@/lib/admin/policy";

const MAX_BYTES = 256;

// Keep retained bytes bounded even when Content-Length is missing or misleading.
export async function readFlagBody(body: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!body) throw new AdminError(422, "invalid");
  const reader = body.getReader();
  const bytes = new Uint8Array(MAX_BYTES);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > MAX_BYTES - length) throw new AdminError(422, "invalid");
      bytes.set(value, length);
      length += value.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length));
  } catch {
    // Do not wait for a remote sender or an asynchronous cancellation to finish.
    void reader.cancel().catch(() => {});
    throw new AdminError(422, "invalid");
  } finally {
    reader.releaseLock();
  }
}
