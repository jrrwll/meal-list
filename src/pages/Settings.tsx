import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { settings, setSettings, type Theme } from '../utils/settings';
import PageHeader from '../components/PageHeader';

const SettingsPage: Component = () => {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = createSignal(settings().base_url);
  const [baseUrlDisable, setBaseUrlDisable] = createSignal(settings().base_url_disable);
  const [localBaseUrl, setLocalBaseUrl] = createSignal(settings().local_base_url);
  const [localBaseUrlDisable, setLocalBaseUrlDisable] = createSignal(settings().local_base_url_disable);
  const [sEeApiKey, setSEeApiKey] = createSignal(settings().s_ee_api_key);
  const [theme, setTheme] = createSignal<Theme>(settings().theme);
  const [saved, setSaved] = createSignal(false);

  const save = (e: Event) => {
    e.preventDefault();
    setSettings({
      base_url: baseUrl().trim(),
      base_url_disable: baseUrlDisable(),
      local_base_url: localBaseUrl().trim(),
      local_base_url_disable: localBaseUrlDisable(),
      s_ee_api_key: sEeApiKey().trim(),
      theme: theme(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <PageHeader title="设置" onBack={() => navigate('/')} />
      <form onSubmit={save} class="p-4 space-y-5">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
            后端地址 (base_url)
          </label>
          <div class="flex gap-2">
            <input
              type="url"
              value={baseUrl()}
              disabled={baseUrlDisable()}
              onInput={(e) => setBaseUrl(e.currentTarget.value)}
              class="flex-1 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:opacity-50"
              placeholder="/api/v1"
            />
            <button
              type="button"
              onClick={() => setBaseUrlDisable((v) => !v)}
              class={`shrink-0 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                baseUrlDisable()
                  ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                  : 'bg-green-50 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
              }`}
            >
              {baseUrlDisable() ? '禁用' : '启用'}
            </button>
          </div>
          <p class="text-xs text-neutral-400 mt-1">所有接口请求会发送到此地址</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
            局域网地址 (local_base_url)
          </label>
          <div class="flex gap-2">
            <input
              type="url"
              value={localBaseUrl()}
              disabled={localBaseUrlDisable()}
              onInput={(e) => setLocalBaseUrl(e.currentTarget.value)}
              class="flex-1 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:opacity-50"
              placeholder="http://192.168.x.x:5000/api/v1"
            />
            <button
              type="button"
              onClick={() => setLocalBaseUrlDisable((v) => !v)}
              class={`shrink-0 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                localBaseUrlDisable()
                  ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                  : 'bg-green-50 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
              }`}
            >
              {localBaseUrlDisable() ? '禁用' : '启用'}
            </button>
          </div>
          <p class="text-xs text-neutral-400 mt-1">
            若配置且可达，优先使用局域网地址（1s 超时探测 GET /ready）
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
            s.ee API Key (s_ee_api_key)
          </label>
          <input
            type="password"
            value={sEeApiKey()}
            onInput={(e) => setSEeApiKey(e.currentTarget.value)}
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            placeholder="配置后可上传文件到 s.ee 图床"
          />
          <p class="text-xs text-neutral-400 mt-1">配置后图片将上传到 s.ee 而非本地服务器</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
            主题
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              class={`flex-1 py-2.5 rounded-lg border text-sm ${
                theme() === 'light'
                  ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              ☀️ 浅色
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              class={`flex-1 py-2.5 rounded-lg border text-sm ${
                theme() === 'dark'
                  ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              🌙 深色
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-xl bg-[#0EA5E9] text-white font-medium text-base active:opacity-80"
        >
          {saved() ? '✓ 已保存' : '保存'}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
