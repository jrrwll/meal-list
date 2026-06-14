import { request } from './client';

export interface Meal {
  id: string;
  name: string;
  description: string;
  images: string[];
  tags: string[];
  ctime: string;
  mtime: string;
}

export interface MealListParams {
  search?: string;
  year?: string;
  month?: string;
  tags?: string[];
}

export interface MealInput {
  id?: string;
  name: string;
  description: string;
  images: string[];
  tags: string[];
}

export function listMeals(params: MealListParams = {}): Promise<Meal[]> {
  const body: Record<string, unknown> = {};
  if (params.search) body.search = params.search;
  if (params.year && params.year !== 'ALL') body.year = params.year;
  if (params.month && params.month !== 'ALL') body.month = params.month;
  if (params.tags && params.tags.length) body.tags = params.tags;
  return request<Meal[]>('/meal/list', { method: 'POST', body })
    .then(res => res.items);
}

export function createMeal(input: MealInput): Promise<Meal> {
  return request<Meal>('/meal/create', { method: 'POST', body: input });
}

export function updateMeal(input: MealInput): Promise<Meal> {
  return request<Meal>('/meal/update', { method: 'POST', body: input });
}
