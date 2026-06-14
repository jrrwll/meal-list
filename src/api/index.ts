// Installs a global fetch interceptor that routes known API paths to the in-memory mock.
// Import this once at app entry to enable mocked APIs in development.

import { handle, MOCK_PATHS } from './mock';
import { settings } from '../utils/settings';
import { localAvailable } from '../utils/local';

function shouldMock(url: string): boolean {
  const s = settings();
  // base_url is disabled and no local available → mock
  if (s.base_url_disable && !localAvailable()) {
    return MOCK_PATHS.some((p) => url.includes(p));
  }
  // local is available → skip mock
  if (localAvailable()) return false;
  // base_url is set → skip mock
  if (s.base_url) return false;
  return MOCK_PATHS.some((p) => url.includes(p));
}

function installMockFetch() {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __MOCK_INSTALLED__?: boolean };
  if (w.__MOCK_INSTALLED__) return;
  w.__MOCK_INSTALLED__ = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (!shouldMock(url)) {
      return realFetch(input as any, init);
    }

    // Merge init from Request object if needed
    const reqInit: RequestInit =
      input instanceof Request
        ? { method: input.method, body: init.body ?? null, headers: input.headers }
        : init;

    // Simulate small network latency for realism
    await new Promise((r) => setTimeout(r, 80));

    try {
      const payload = await handle(url, reqInit);
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ code: 'error', msg: (err as Error).message, data: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
  };
}

installMockFetch();
