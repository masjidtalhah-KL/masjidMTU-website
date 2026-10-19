import {chromium} from '@playwright/test';
import {reviewIdentity} from './review-fixture.mjs';
import {nativeReviewDownloads, reviewRequestAllowed} from './review-downloads.mjs';

const role = process.argv[2] ?? 'admin';
if (!['admin', 'staff', 'owner'].includes(role)) throw Error('Use admin | staff | owner');
const check = process.argv[3] === '--check';
if (process.argv[3] && !check) throw Error('Unknown option');
const {campaign, session} = reviewIdentity(role);
const browser = await chromium.launch({channel: 'msedge', headless: check});
const context = await browser.newContext();
await context.route('**/*', route => reviewRequestAllowed(route.request().url()) ? route.continue() : route.abort());
await context.addCookies([{
  name: 'sb-127-auth-token',
  value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
  url: 'http://localhost:3082/admin', sameSite: 'Lax', httpOnly: true,
}]);
const page = await context.newPage();
await nativeReviewDownloads(context, page);
await page.goto('http://localhost:3082/admin/campaigns/' + campaign + '/ramadan');
await page.getByRole('heading', {name: 'Program Tajaan', exact: true}).waitFor();
console.log('LOCAL SYNTHETIC ' + role + ' review: normal protected route; not genuine OAuth/MFA evidence.');
console.log('Local Google OAuth is disabled. Use this review window; rerun the command if its synthetic session expires.');
console.log('Native named downloads: .cache/ramadan-review-downloads (retained after closing this window).');
if (check) await browser.close();
else await new Promise(resolve => browser.once('disconnected', resolve));
