const BASE_URL = process.env.VITE_API_URL;

export interface MealItem {
  id: string | number;
  name: string;
  description: string | null;
  images: string[];
  tags: string[];
  ctime: string;
}

export interface MealListParams {
  search?: string;
  year?: string;
  month?: string;
  tags?: string[];
}

export interface MealListResponse {
  err_code: string;
  err_args: unknown;
  data: {
    items: MealItem[];
  };
}

export async function fetchMealList(params: MealListParams): Promise<MealListResponse> {
  const body: Record<string, unknown> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === 'ALL') return;
    if (Array.isArray(v) && v.length === 0) return;
    body[k] = v;
  });
  const res = await fetch(`${BASE_URL}/meal/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to fetch meal list: ${res.status}`);
  return res.json();
}

export interface TagItem {
  name: string;
  count: number;
}

export async function fetchTagList(): Promise<TagItem[]> {
  const res = await fetch(`${BASE_URL}/meal/tag/list`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to fetch tag list: ${res.status}`);
  const json = await res.json();
  return json.data?.items || [];
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/file/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to upload file: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function createMeal(data: {
  name: string;
  description: string | null;
  images: string[];
  tags: string[];
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/meal/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create meal: ${res.status}`);
}

export async function fetchMealDetail(id: string): Promise<MealItem> {
  const res = await fetch(`${BASE_URL}/meal/get?id=${encodeURIComponent(id)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to fetch meal detail: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function updateMeal(data: {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  tags: string[];
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/meal/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update meal: ${res.status}`);
}
