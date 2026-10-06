import { execFileSync, spawnSync } from 'node:child_process';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from './database.mjs';

// Same local GoTrue image/DB/hook, with email enabled ONLY in a disposable
// loopback probe to reach the provider-rejection branch. Main config is unchanged.
export async function hookProbe(stack) {
  const name = 'supabase_auth_hook_probe_mtu-admin-local';
  if (spawnSync('docker', ['inspect', name], { stdio: 'ignore' }).status === 0) throw Error('A hook probe already exists; refusing to replace it');
  const source = JSON.parse(execFileSync('docker', ['inspect', 'supabase_auth_mtu-admin-local'], { encoding: 'utf8' }))[0];
  const env = { ...stack.authEnv, GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true', GOTRUE_MAILER_AUTOCONFIRM: 'true' };
  if (Object.values(env).some(v => /[\r\n]/.test(v))) throw Error('Unsupported local probe environment encoding');
  const directory = path.join(root, '.cache');
  const file = path.join(directory, 'local-hook-probe.env');
  await mkdir(directory, { recursive: true });
  await writeFile(file, Object.entries(env).map(([key,value]) => key + '=' + value).join('\n') + '\n');
  let created = false;
  const close = async () => {
    if (created) execFileSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
    await unlink(file).catch(() => {});
  };
  try {
    execFileSync('docker', ['run', '--detach', '--name', name, '--label', 'mtu.local-verification=hook-probe',
      '--network', source.HostConfig.NetworkMode, '--publish', '127.0.0.1:54330:9999',
      '--env-file', file, source.Config.Image], { stdio: 'ignore' });
    created = true;
    const deadline = Date.now() + 15000;
    while (true) {
      try { const response = await fetch('http://127.0.0.1:54330/health'); if (response.ok) break; } catch { /* startup only */ }
      if (Date.now() > deadline) throw Error('Local hook probe did not become healthy');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return {
      async signup(email, metadata = {}) {
        const response = await fetch('http://127.0.0.1:54330/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({email,password:'Synthetic-probe-password-ONLY-394!',data:metadata}),
        });
        return { status: response.status, data: await response.json() };
      },
      close,
    };
  } catch (error) { await close(); throw error; }
}
