import assert from 'node:assert/strict';
const base=process.argv[2]??'http://localhost:3037';
const get=route=>fetch(base+route,{redirect:'manual'});
for(const route of ['/admin','/admin/users','/admin/settings','/admin/mfa']) {
  const response=await get(route);assert.equal(response.status,307,route);
  assert(response.headers.get('location')?.startsWith('/admin/login'),route);
  assert.match(response.headers.get('cache-control'),/no-store/);
}
const login=await get('/admin/login'); assert.equal(login.status,200);
const html=await login.text();assert.match(html,/Invitation only/);assert.doesNotMatch(html,/public-route-transition__outgoing/);
for(const route of ['/admin/api/security','/admin/api/access']) {
  const response=await get(route); assert([401,503].includes(response.status),route);
  assert.match(response.headers.get('cache-control'),/no-store/);
}
for(const route of ['/admin/auth/signout','/admin/auth/google']) {
  const response=await fetch(base+route,{method:'POST',headers:{origin:'https://evil.test'}});
  assert([403,503].includes(response.status),route);
}
assert.equal((await get('/admin/auth/signout')).status,405);
console.log('PASS: login, protected-route redirects, API failures, CSRF denial, private/no-store and POST-only logout.');
