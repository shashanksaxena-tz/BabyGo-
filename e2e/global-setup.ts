import { FullConfig } from '@playwright/test';

async function waitForUrl(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

export default async function globalSetup(_config: FullConfig) {
  await Promise.all([
    waitForUrl('http://localhost:3001/health'),
    waitForUrl('http://localhost:5173/'),
    waitForUrl('http://localhost:3005/'),
  ]);
}
