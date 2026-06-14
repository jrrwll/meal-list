import { request } from './client';

export interface Tag {
  name: string;
  count: number;
}

export function listTags(): Promise<Tag[]> {
  return request<Tag[]>('/meal/tag/list', { method: 'POST' })
    .then(res => res.items);
}
