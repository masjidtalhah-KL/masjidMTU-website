'use client';

import {useRef, useState} from 'react';
import type {SponsorPage} from '@/lib/ramadan/contracts';

const empty: SponsorPage = {rows: [], page: 1, has_more: false};

// Initial pages arrive with the server-rendered campaign snapshot. Only an
// explicit page change fetches again, keeping one bounded page in client state.
export function RamadanConfirmedSponsors({slug, offering, schedule, initial = empty}: {
  slug: string;
  offering: string;
  schedule?: string;
  initial?: SponsorPage;
}) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  async function load(page: number) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const query = new URLSearchParams({offering, page: String(page), ...(schedule ? {schedule} : {})});
      const response = await fetch('/kempen/' + slug + '/tajaan/penaja?' + query, {cache: 'no-store'});
      if (!response.ok) throw Error();
      const next = await response.json() as SponsorPage;
      if (!Array.isArray(next.rows) || next.rows.length > 20 || next.page !== page) throw Error();
      setData(next);
      requestAnimationFrame(() => feedback.current?.focus());
    } catch {
      setError('Senarai belum dapat dimuatkan. Sila cuba lagi.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <section aria-label={schedule ? 'Status slot tajaan' : 'Penaja sumbangan terbuka disahkan'} aria-busy={busy}>
    {!schedule && <h4>Penaja sumbangan terbuka disahkan</h4>}
    {(error || busy || data.page > 1) && <p ref={feedback} tabIndex={-1} role="status">{error || (busy ? 'Memuatkan…' : 'Halaman ' + data.page)}</p>}
    {!data.rows.length && <p>{schedule ? 'Slot belum disediakan.' : 'Belum ada sumbangan disahkan.'}</p>}
    <ul className="ramadan-slot-list">{data.rows.map((row, index) => <li key={row.slot_number ?? index}>
      {row.slot_number !== null && <strong>Slot {row.slot_number} — </strong>}
      {row.display_name ?? 'Belum ditaja'}
    </li>)}</ul>
    {(data.page > 1 || data.has_more) && <div className="ramadan-actions">
      {data.page > 1 && <button className="button button--secondary" disabled={busy} onClick={() => void load(data.page - 1)}>Sebelumnya</button>}
      {data.has_more && <button className="button button--secondary" disabled={busy} onClick={() => void load(data.page + 1)}>Papar Lagi</button>}
    </div>}
  </section>;
}
