import type {NextRequest} from 'next/server';
import {downloadProof} from '@/lib/ramadan/payment';
import {paymentJson, paymentFailure, paymentOrigin, paymentHeaders, boundedBytes} from '@/lib/ramadan/payment-http';
import {exact, RamadanError, uuid} from '@/lib/ramadan/contracts';
import {reviewPayment} from '@/lib/ramadan/verification';

export const dynamic = 'force-dynamic';
type Route = {params: Promise<{id: string; sponsorship: string}>};

async function attachment(params: Route['params'], proof: unknown, page: unknown) {
  if (!uuid(proof) || !Number.isInteger(page) || Number(page) < 1 || Number(page) > 10000) throw new RamadanError(422, 'invalid');
  const {id, sponsorship} = await params;
  // Every request rechecks Foundation role/MFA and exact campaign/sponsorship
  // ownership, including a retained rejected attempt from the bounded history.
  const detail = await reviewPayment(id, sponsorship, Number(page)) as {proof?: {id: string}; history?: Array<{id: string}>} | null;
  if (detail?.proof?.id !== proof && !detail?.history?.some(p => p.id === proof)) return paymentJson({error: 'denied'}, 404);
  const file = await downloadProof(id, String(proof));
  return new Response(new Uint8Array(file.bytes), {headers: {...paymentHeaders, 'Content-Type': file.content_type, 'Content-Disposition': 'attachment; filename="' + file.filename + '"'}});
}

// Native attachment navigation preserves the HTTP filename in embedded browsers
// too. Failed authorization returns sanitized JSON without an attachment header.
export async function GET(request: NextRequest, {params}: Route) {
  try {
    const query = request.nextUrl.searchParams;
    if ([...query.keys()].sort().join() !== 'history_page,proof_id' || !/^[1-9][0-9]{0,4}$/.test(query.get('history_page') ?? '')) throw new RamadanError(422, 'invalid');
    return await attachment(params, query.get('proof_id'), Number(query.get('history_page')));
  } catch (error) { return paymentFailure(error); }
}

export async function POST(request: NextRequest, {params}: Route) {
  try {
    paymentOrigin(request);
    if (request.headers.get('content-type') !== 'application/json') throw new RamadanError(422, 'invalid');
    let value;
    try {
      const raw = JSON.parse((await boundedBytes(request.body, 384)).toString('utf8'));
      value = exact(raw, raw && Object.hasOwn(raw, 'history_page') ? ['proof_id', 'history_page'] : ['proof_id']);
    } catch { throw new RamadanError(422, 'invalid'); }
    return await attachment(params, value.proof_id, value.history_page ?? 1);
  } catch (error) { return paymentFailure(error); }
}
