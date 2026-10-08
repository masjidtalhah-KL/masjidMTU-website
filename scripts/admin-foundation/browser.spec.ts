import { test, expect, type BrowserContext } from "@playwright/test";
async function login(context: BrowserContext, name: string, query = "") {
  const response=await context.request.get(`http://127.0.0.1:54329/__fixture/session/${name}${query}`);
  const cookie=await response.json();
  await context.addCookies([{name:cookie.name,value:cookie.value,domain:"localhost",path:"/admin",sameSite:"Lax",httpOnly:false,secure:false}]);
  return cookie.session.access_token;
}
async function switchToStaff(context: BrowserContext) {
  await login(context,'staff');
  // Send from another tab: the protected page may already be navigating after
  // its initial session/live check observes the changed cookie.
  const sender=await context.newPage();await sender.goto('/admin/login');
  await sender.evaluate(()=>{const channel=new BroadcastChannel('sb-127-auth-token');channel.postMessage({event:'SIGNED_IN',session:{user:{id:'00000000-0000-4000-8000-000000000003'}}});channel.close();});
  await sender.close();
}
test("anonymous routes/API fail closed; CSRF and GET logout rejected",async({page,request})=>{
  await page.goto('/admin/users');await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading',{name:'Admin sign in'})).toBeVisible();
  expect((await request.get('/admin/api/access')).status()).toBe(401);
  expect((await request.post('/admin/auth/signout',{headers:{origin:'https://evil.test'}})).status()).toBe(403);
  expect((await request.get('/admin/auth/signout')).status()).toBe(405);
});
for(const name of ['outsider','disabled','revoked'])test(`${name}: denied page and API with otherwise valid signed synthetic session`,async({page,context})=>{
  await login(context,name);await page.goto('/admin');
  await expect(page).toHaveURL(/state=denied/);
  expect((await context.request.get('/admin/api/security')).status()).toBe(403);
});
for(const name of ['staff','admin'])test(`${name}: Home/Settings only; direct owner route and API denied`,async({page,context})=>{
  await login(context,name);await page.goto('/admin');await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link',{name:'Users'})).toHaveCount(0);
  await page.goto('/admin/settings');await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
  expect((await context.request.get('/admin/api/access')).status()).toBe(403);
  await page.goto('/admin/users');await expect(page).toHaveURL(/state=denied/);
});
test('owner AAL1 redirects to minimal MFA, cannot read or mutate users',async({page,context})=>{
  await login(context,'owner','?aal=aal1');await page.goto('/admin/users');await expect(page).toHaveURL(/\/admin\/mfa/);
  await expect(page.getByRole('heading',{name:'Verify your authenticator'})).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  expect((await context.request.get('/admin/api/access')).status()).toBe(403);
});
test('owner AAL2 can invite admin/staff; SQL-backed user UI refreshes without promotion',async({page,context},testInfo)=>{
  await login(context,'owner');await page.goto('/admin/users');
  await expect(page.getByRole('heading',{name:'Users & invitations'})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('admin-users-desktop.png'),fullPage:true});
  await expect(page.getByRole('option',{name:'super_admin',exact:true})).toHaveCount(0);
  await page.getByLabel('Approved Google email').fill('browser-invite@example.test');
  await page.getByRole('button',{name:'Create invitation'}).click();
  await expect(page.getByText('Change saved.',{exact:true})).toBeVisible();
  await expect(page.getByText('browser-invite@example.test',{exact:true})).toBeVisible();
  expect((await context.request.get('/admin/api/access')).headers()['cache-control']).toContain('no-store');
});
test('stale owner MFA remains read-only and requires real re-verification, not a UI clock',async({page,context})=>{
  await login(context,'owner','?stale=1');await page.goto('/admin/users');
  await expect(page.getByRole('button',{name:'Create invitation'})).toBeDisabled();
  const response=await context.request.post('/admin/api/access',{headers:{origin:'http://localhost:3037'},data:{operation:'invite',email:'blocked@example.test',role:'staff'}});
  expect(response.status()).toBe(403);expect((await response.json()).error).toBe('step-up');
});
test('direct SQL-backed HTTP adapter bypass and forged tokens cannot manage users',async({context,request})=>{
  const token=await login(context,'staff');
  expect((await request.post('http://127.0.0.1:54329/rest/v1/rpc/admin_create_invite',{headers:{authorization:`Bearer ${token}`},data:{invitee_email:'bypass@example.test',invitee_role:'super_admin'}})).status()).toBe(403);
  expect((await request.post('http://127.0.0.1:54329/rest/v1/admin_profiles',{headers:{authorization:`Bearer ${token}`},data:{role:'super_admin'}})).status()).toBe(403);
  const forged=token.slice(0,-5)+'wrong';
  expect((await request.get('http://127.0.0.1:54329/auth/v1/user',{headers:{authorization:`Bearer ${forged}`}})).status()).toBe(401);
});
test('logout clears authenticated screen and public transitions never retain it',async({page,context})=>{
  await login(context,'owner');await page.goto('/admin');await page.goto('/admin/users');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/state=signed-out/);
  await expect(page.getByRole('heading',{name:'Users & invitations'})).toHaveCount(0);
  await expect(page.locator('.public-route-transition__outgoing')).toHaveCount(0);
  await page.goBack();await expect(page).toHaveURL(/\/admin\/login/);
});
test('account switch and navigation away discard the previous admin screen',async({page,context})=>{
  await login(context,'owner');await page.goto('/admin/users');
  await switchToStaff(context);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto('/admin');
  await expect(page.getByRole('heading',{name:'Users & invitations'})).toHaveCount(0);
  await expect(page.locator('.public-route-transition__outgoing')).toHaveCount(0);
  await page.getByRole('link',{name:'Public website'}).click();await expect(page).toHaveURL('http://localhost:3037/');
  await expect(page.getByRole('heading',{name:'Users & invitations'})).toHaveCount(0);
});
test('MFA provider failure leaves AAL1 owner denied and never invents successful verification',async({page,context})=>{
  await login(context,'owner','?aal=aal1');await page.goto('/admin/mfa');
  await page.getByLabel('6-digit code').fill('123456');
  await page.getByRole('button',{name:'Verify and continue'}).click();
  await expect(page.getByRole('alert').filter({ hasText: /Verification failed/ })).toHaveText(/Verification failed/);
  await expect(page).toHaveURL(/\/admin\/mfa/);
  expect((await context.request.get('/admin/api/access')).status()).toBe(403);
});

// UI contract fixtures only. No successful Auth/TOTP verification is simulated.
for (const labels of [["Backup authenticator"], ["Primary authenticator"], ["Primary authenticator", "Backup authenticator"], ["Backup authenticator", "Primary authenticator"]]) {
  test(`MFA recovery labels/default: ${labels.join(', ')}`, async ({ page, context }) => {
    await login(context, 'owner', '?aal=aal1');
    await page.route('**/auth/v1/user', async route => {
      const response = await route.fetch();
      const user = await response.json();
      user.factors = labels.map((friendly_name, index) => ({ id: `00000000-0000-4000-8000-0000000000${index + 21}`, friendly_name, factor_type: 'totp', status: 'verified' }));
      await route.fulfill({ response, json: user });
    });
    await page.goto('/admin/mfa');
    const selection = page.getByRole('combobox', { name: 'Authenticator', exact: true });
    const defaultLabel = labels.includes('Primary authenticator') ? 'Primary authenticator' : 'Backup authenticator';
    await expect(selection.locator('option:checked')).toHaveText(defaultLabel);
    if (labels.length === 2) {
      await expect(page.getByRole('button', { name: 'Add backup authenticator' })).toBeDisabled();
      await selection.selectOption({ label: 'Backup authenticator' });
      await expect(selection.locator('option:checked')).toHaveText('Backup authenticator');
    } else {
      const missing = labels[0] === 'Backup authenticator' ? 'Primary authenticator' : 'Backup authenticator';
      let requestedName: string | undefined;
      await page.route('**/auth/v1/factors', async route => {
        requestedName = route.request().postDataJSON().friendly_name;
        await route.fulfill({ status: 501, json: { msg: 'Synthetic enrollment unavailable' } });
      });
      await page.getByRole('button', { name: missing === 'Primary authenticator' ? 'Add primary authenticator' : 'Add backup authenticator' }).click();
      await expect(page.getByRole('alert').filter({ hasText: /Could not enroll/ })).toHaveText(/Could not enroll/);
      expect(requestedName).toBe(missing);
      expect(requestedName).not.toBe(labels[0]);
      await expect(selection.locator('option:checked')).toHaveText(defaultLabel);
      expect((await context.request.get('/admin/api/access')).status()).toBe(403);
    }
  });
}
test('mobile navigation is focus-contained, keyboard accessible and does not overflow',async({page,context},testInfo)=>{
  await page.setViewportSize({width:375,height:812});await login(context,'owner');await page.goto('/admin/users');
  await page.getByRole('button',{name:'Open admin navigation'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link',{name:'Users',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('admin-users-mobile.png'),fullPage:true});
});

test('MFA account change discards the previous security screen',async({page,context})=>{
  await login(context,'owner','?aal=aal1');await page.goto('/admin/mfa');
  await switchToStaff(context);
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole('heading',{name:'Verify your authenticator'})).toHaveCount(0);
});

test('owner membership controls and invite revocation audit committed changes',async({page,context})=>{
  await login(context,'owner');await page.goto('/admin/users');
  page.on('dialog',dialog=>dialog.accept());
  const row=page.getByRole('row').filter({hasText:'admin@example.test'});
  await row.getByRole('button',{name:'Change role',exact:true}).click();
  await expect(row.getByRole('cell',{name:'staff',exact:true})).toBeVisible();
  await row.getByRole('button',{name:'Disable',exact:true}).click();
  await expect(row.getByRole('cell',{name:'disabled',exact:true})).toBeVisible();
  await expect(page.getByText(/Provider session termination remains pending/)).toBeVisible();
  await row.getByRole('button',{name:'Reactivate',exact:true}).click();
  await expect(row.getByRole('cell',{name:'active',exact:true})).toBeVisible();
  await row.getByRole('button',{name:'Revoke',exact:true}).click();
  await expect(row.getByRole('cell',{name:'revoked',exact:true})).toBeVisible();
  await page.locator('.admin-invites li').filter({hasText:'browser-invite@example.test'}).getByRole('button',{name:'Revoke invitation'}).click();
  await expect(page.getByText('browser-invite@example.test',{exact:true})).toHaveCount(0);
  await expect(page.locator('.admin-audit').getByText('member.revoke',{exact:true})).toBeVisible();
});
test('public homepage, Studio and Kuliah routes still render independently',async({page,request})=>{
  for(const route of ['/','/studio/penjana-jadual-kuliah','/kuliah','/kuliah/2026-10'])expect((await request.get(route)).status()).toBe(200);
  await page.goto('/kuliah');await expect(page.locator('[data-lecture-poster]')).toBeVisible();
  await expect(page.locator('.admin-shell')).toHaveCount(0);
});
test('published Kuliah PNG/PDF export still downloads real artifacts',async({page})=>{
  test.setTimeout(60000);await page.goto('/kuliah/2026-10');
  for(const format of ['PNG','PDF']) {
    const button=page.getByRole('button',{name:`Muat turun ${format}`,exact:true});await expect(button).toBeEnabled();
    const downloaded=page.waitForEvent('download');await button.click();const download=await downloaded;
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format.toLowerCase()}$`));
    expect(await download.failure()).toBe(null);
  }
});
