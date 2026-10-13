// Installs a global fetch interceptor that routes known API paths to the in-memory mock.
// Import this once at app entry to enable mocked APIs in development.

import { handle, MOCK_PATHS } from './mock';

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

    if (!MOCK_PATHS.some((path) => url.includes(path))) {
      return realFetch(input, init);
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
