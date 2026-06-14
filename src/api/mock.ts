// In-memory mock backend. Used by ./index.ts which installs a fetch interceptor.

interface MealRecord {
  id: string;
  name: string;
  description: string;
  images: string[];
  tags: string[];
  ctime: string;
  mtime: string;
}

function mock_resp<T>(data: T) {
  return {
    msg: '',
    code: 'ok',
    data: {
      items: data
    },
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function nowStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function mock_meal(id: string): MealRecord {
  const seedMonth = ((parseInt(id, 10) || 1) % 12) + 1;
  const seedYear = 2024 + (parseInt(id, 10) % 3);
  return {
    id,
    name: `餐单 - ${id}`,
    description: 'xxx\nyyy\nzzz',
    images: [
      `https://picsum.photos/seed/${id}-1/800/600`,
      `https://picsum.photos/seed/${id}-2/800/600`,
      `https://picsum.photos/seed/${id}-3/800/600`,
      `https://picsum.photos/seed/${id}-4/800/600`,
      `https://picsum.photos/seed/${id}-5/800/600`,
      `https://picsum.photos/seed/${id}-6/800/600`,
      `https://picsum.photos/seed/${id}-7/800/600`,
    ],
    tags: pickTags(parseInt(id, 10) || 0),
    ctime: `${seedYear}-${pad(seedMonth)}-${pad(((parseInt(id, 10) || 1) % 27) + 1)} 12:00:00`,
    mtime: `${seedYear}-${pad(seedMonth)}-${pad(((parseInt(id, 10) || 1) % 27) + 1)} 12:00:00`,
  };
}

const ALL_TAGS = ['鸡', '鸭', '鹅', '牛', '羊', '猪', '鱼', '虾', '蔬菜', '汤'];

function pickTags(seed: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    out.push(ALL_TAGS[(seed + i * 3) % ALL_TAGS.length]);
  }
  return Array.from(new Set(out));
}

function mock_tag() {
  // Compute counts from current meals
  const counts = new Map<string, number>();
  for (const m of meals) {
    for (const t of m.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return ALL_TAGS.filter((t) => counts.has(t)).map((t) => ({
    name: t,
    count: counts.get(t)!,
  }));
}

// Seed 23 meals so pagination is visible
const meals: MealRecord[] = Array.from({ length: 23 }, (_, i) => mock_meal(String(i + 1)));
let nextId = meals.length + 1;

const settings = { base_url: 'http://mock.local' };

interface ListReq {
  search?: string;
  year?: string;
  month?: string;
  tags?: string[];
}

interface MealInputReq {
  id?: string;
  name: string;
  description: string;
  images: string[];
  tags: string[];
}

function handleMealList(body: ListReq) {
  let out = meals.slice();
  if (body.search) {
    const q = body.search.toLowerCase();
    out = out.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    );
  }
  if (body.year) out = out.filter((m) => m.ctime.startsWith(body.year!));
  if (body.month) out = out.filter((m) => m.ctime.slice(5, 7) === body.month);
  if (body.tags?.length) {
    out = out.filter((m) => body.tags!.every((t) => m.tags.includes(t)));
  }
  // Newest first
  out.sort((a, b) => (a.ctime < b.ctime ? 1 : -1));
  return mock_resp(out);
}

function handleMealCreate(body: MealInputReq) {
  const id = String(nextId++);
  const now = nowStr();
  const rec: MealRecord = {
    id,
    name: body.name,
    description: body.description,
    images: body.images ?? [],
    tags: body.tags ?? [],
    ctime: now,
    mtime: now,
  };
  meals.unshift(rec);
  return mock_resp(rec);
}

function handleMealUpdate(body: MealInputReq) {
  const idx = meals.findIndex((m) => m.id === body.id);
  if (idx < 0) {
    // Fall back to create-style success to keep "都成功"
    return handleMealCreate(body);
  }
  const merged: MealRecord = {
    ...meals[idx],
    name: body.name,
    description: body.description,
    images: body.images ?? [],
    tags: body.tags ?? [],
    mtime: nowStr(),
  };
  meals[idx] = merged;
  return mock_resp(merged);
}

async function handleFileUpload(form: FormData): Promise<ReturnType<typeof mock_resp>> {
  const file = form.get('file');
  if (file instanceof File) {
    // Convert to data URL so the preview actually renders.
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return mock_resp(url);
  }
  return mock_resp(`https://picsum.photos/seed/upload-${Date.now()}/800/600`);
}

function handleSettingsGet() {
  return mock_resp({ ...settings });
}

function handleSettingsUpdate(body: { base_url?: string }) {
  if (body.base_url !== undefined) settings.base_url = body.base_url;
  return mock_resp({ ...settings });
}

export async function handle(
  path: string,
  init: RequestInit,
): Promise<ReturnType<typeof mock_resp>> {
  const body = init.body;
  const parseJson = (): any => {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return {};
  };

  // Normalize: strip query if any
  const clean = path.split('?')[0];

  if (clean.endsWith('/meal/list')) return handleMealList(parseJson());
  if (clean.endsWith('/meal/create')) return handleMealCreate(parseJson());
  if (clean.endsWith('/meal/update')) return handleMealUpdate(parseJson());
  if (clean.endsWith('/tag/list')) return mock_resp(mock_tag());
  if (clean.endsWith('/file/upload')) {
    if (body instanceof FormData) return handleFileUpload(body);
    return mock_resp('https://picsum.photos/seed/upload/800/600');
  }
  if (clean.endsWith('/settings/get')) return handleSettingsGet();
  if (clean.endsWith('/settings/update')) return handleSettingsUpdate(parseJson());

  return { code: 'not_found', msg: `mock route not handled: ${clean}`, data: null };
}

export const MOCK_PATHS = [
  '/meal/list',
  '/meal/create',
  '/meal/update',
  '/tag/list',
  '/file/upload',
  '/settings/get',
  '/settings/update',
];
