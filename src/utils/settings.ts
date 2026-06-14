import { createSignal } from 'solid-js';

export type Theme = 'light' | 'dark';

export interface Settings {
  base_url: string;
  base_url_disable: boolean;
  local_base_url: string;
  local_base_url_disable: boolean;
  s_ee_api_key: string;
  theme: Theme;
}

const STORAGE_KEY = 'meal-list-settings';

const DEFAULTS: Settings = {
  base_url: '/api/v1',
  base_url_disable: false,
  local_base_url: '',
  local_base_url_disable: false,
  s_ee_api_key: '',
  theme: 'light',
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

const [settings, setSettingsSignal] = createSignal<Settings>(load());

export { settings };

export function setSettings(next: Partial<Settings>) {
  const merged = { ...settings(), ...next };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  setSettingsSignal(merged);
  applyTheme(merged.theme);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

applyTheme(settings().theme);
