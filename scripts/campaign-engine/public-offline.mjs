// Verification-only preload: refuse external I/O; never substitute hosted content.
// NODE_OPTIONS propagates this guard to Next build workers and test app processes.
import http from 'node:http';
import https from 'node:https';
const loopback = hostname => ['localhost','127.0.0.1','::1','[::1]'].includes(hostname);
const unavailable = () => Object.assign(new Error('Offline verification: external request refused'), {code:'ECONNREFUSED'});
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!loopback(url.hostname)) return Promise.reject(unavailable());
  return originalFetch(input, options);
};
for (const transport of [http,https]) for (const method of ['request','get']) {
  const original = transport[method];
  transport[method] = function(input,...args) {
    const hostname = typeof input === 'string' || input instanceof URL ? new URL(input).hostname : input?.hostname ?? input?.host ?? 'localhost';
    if (!loopback(String(hostname))) throw unavailable();
    return original.call(this,input,...args);
  };
}
