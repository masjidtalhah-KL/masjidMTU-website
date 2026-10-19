// LOCAL REVIEW ONLY. Preserve native filenames in the owner's synthetic Edge
// window instead of Playwright's GUID-named temporary download artifacts.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {root} from '../admin-foundation/database.mjs';
import {localReviewStack} from '../ramadan-domain/review-fixture.mjs';

export function reviewRequestAllowed(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (['http://localhost:3082', 'http://127.0.0.1:54321'].includes(url.origin)) return true;
    if (url.protocol !== 'file:' || url.hostname || url.search || url.hash) return false;
    const file = fileURLToPath(url), directory = path.join(root, '.cache', 'ramadan-review-downloads');
    if (path.dirname(file) !== directory || !/^(?:Bukti-Bayaran-RPF-[0-9a-f]{64}\.(?:png|jpg|pdf)|RAM-[0-9]{4}-[0-9]{6}\.pdf|Laporan-Tajaan-Ramadan-[0-9]{4}-[0-9]{8}(?: \([1-9][0-9]{0,4}\))?\.xlsx)$/.test(path.basename(file))) return false;
    return fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink() && fs.realpathSync(file) === file;
  } catch { return false; }
}

export async function nativeReviewDownloads(context, page) {
  localReviewStack(); // Exact disposable local project; rejects hosted/production.
  const directory = path.join(root, '.cache', 'ramadan-review-downloads');
  fs.mkdirSync(directory, {recursive: true});
  if (fs.realpathSync(directory) !== directory) throw Error('Review download directory must not be redirected');
  const browser = context.browser();
  if (!browser) throw Error('Local Chromium reviewer required');
  const target = await context.newCDPSession(page);
  const control = await browser.newBrowserCDPSession();
  try {
    const {targetInfo} = await target.send('Target.getTargetInfo');
    if (!targetInfo.browserContextId) throw Error('Isolated review context required');
    // "allow" retains the HTTP Content-Disposition filename. "allowAndName",
    // Playwright's default, saves a GUID without its extension in Edge Downloads.
    await control.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      browserContextId: targetInfo.browserContextId,
      downloadPath: directory,
      eventsEnabled: true,
    });
    // Chromium ties this override to the CDP session. Keep it alive for the
    // review context; detaching here would restore the GUID/default behavior.
    context.once('close', () => { void control.detach().catch(() => {}); });
  } catch (error) {
    await control.detach().catch(() => {});
    throw error;
  } finally {
    await target.detach();
  }
  return directory;
}
