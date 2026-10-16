import { QURBAN_BODY_BYTES, QurbanError } from "./registration-contract";
export async function readQurbanBody(body: ReadableStream<Uint8Array> | null, limit = QURBAN_BODY_BYTES) {
  if (!body) throw new QurbanError(422, "invalid");
  const reader = body.getReader(), bytes = new Uint8Array(limit);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > bytes.length - length) throw new QurbanError(413, "invalid");
      bytes.set(value, length); length += value.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, length))) as unknown;
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error instanceof QurbanError ? error : new QurbanError(422, "invalid");
  } finally { reader.releaseLock(); }
}
