import { request } from './client';

export interface ServerSettings {
  base_url: string;
}

export function getServerSettings(): Promise<ServerSettings> {
  return request<ServerSettings>('/settings/get', { method: 'POST' });
}

export function updateServerSettings(s: ServerSettings): Promise<ServerSettings> {
  return request<ServerSettings>('/settings/update', { method: 'POST', body: s });
}
