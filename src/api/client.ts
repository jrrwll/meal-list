import { settings } from '../utils/settings';
import { localAvailable } from '../utils/local';

export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
}

function effectiveBaseUrl(): string {
  const s = settings();

  if (s.local_base_url && !s.local_base_url_disable && localAvailable()) {
    return s.local_base_url;
  }
  if (!s.base_url_disable && s.base_url) {
    return s.base_url;
  }
  return '';
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const url = joinUrl(effectiveBaseUrl(), path);

  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const resp = await fetch(url, init);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  }
  const json = (await resp.json()) as ApiResponse<T>;
  if (json.code && json.code !== 'ok') {
    throw new Error(json.msg || 'request failed');
  }
  return json.data;
}
