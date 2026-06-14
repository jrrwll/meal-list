import type { Component } from 'solid-js';
import { createSignal, createResource, createMemo, For, Show, onCleanup, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { listMeals, type Meal } from '../api/meal';
import { listTags } from '../api/tag';
import { yearOptions, monthOptions } from '../utils/format';
import MealCard from '../components/MealCard';
import AddButton from '../components/AddButton';

const PAGE_SIZE = 5;

const ListPage: Component = () => {
  const navigate = useNavigate();
  const [search, setSearch] = createSignal('');
  const [searchInput, setSearchInput] = createSignal('');
  const [year, setYear] = createSignal('ALL');
  const [month, setMonth] = createSignal('ALL');
  const [selTags, setSelTags] = createSignal<string[]>([]);
  const [page, setPage] = createSignal(1);

  const [meals] = createResource(
    () => ({ search: search(), year: year(), month: month(), tags: selTags() }),
    (p) => {
      setPage(1);
      return listMeals(p);
    },
  );
  const [tagList] = createResource(() => listTags().catch(() => []));

  const visible = createMemo<Meal[]>(() => (meals() ?? []).slice(0, page() * PAGE_SIZE));
  const hasMore = createMemo(() => (meals()?.length ?? 0) > visible().length);

  let sentinel: HTMLDivElement | undefined;
  onMount(() => {
    if (!sentinel) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore()) {
        setPage((p) => p + 1);
      }
    });
    io.observe(sentinel);
    onCleanup(() => io.disconnect());
  });

  const toggleTag = (name: string) => {
    setSelTags((cur) =>
      cur.includes(name) ? cur.filter((t) => t !== name) : [...cur, name],
    );
  };

  let tagClickTimer: number | undefined;
  const TAG_CLICK_DELAY = 240;
  const handleTagClick = (name: string) => {
    if (tagClickTimer !== undefined) {
      clearTimeout(tagClickTimer);
      tagClickTimer = undefined;
      setSelTags([name]); // double-click: force single-select
      return;
    }
    tagClickTimer = window.setTimeout(() => {
      tagClickTimer = undefined;
      toggleTag(name);
    }, TAG_CLICK_DELAY);
  };

  const onSearchSubmit = (e: Event) => {
    e.preventDefault();
    setSearch(searchInput().trim());
  };

  return (
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-8">
      <header class="sticky top-0 z-10 bg-[#0EA5E9] dark:bg-[#1a1a1a] shadow-sm">
        <div class="flex items-center gap-2 px-3 py-2.5">
          <AddButton
            onSingle={() => navigate('/create')}
            onDouble={() => navigate('/settings')}
          />
          <form onSubmit={onSearchSubmit} class="flex-1">
            <input
              type="search"
              value={searchInput()}
              onInput={(e) => setSearchInput(e.currentTarget.value)}
              placeholder="搜索餐单"
              class="w-full px-3 py-2 rounded-full bg-white dark:bg-neutral-800 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </form>
        </div>
        <div class="px-3 pb-2.5 flex gap-2">
          <select
            value={year()}
            onChange={(e) => setYear(e.currentTarget.value)}
            class="px-2 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-200"
          >
            <For each={yearOptions()}>
              {(y) => <option value={y}>{y === 'ALL' ? '全部年份' : y + '年'}</option>}
            </For>
          </select>
          <select
            value={month()}
            onChange={(e) => setMonth(e.currentTarget.value)}
            class="px-2 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-200"
          >
            <For each={monthOptions()}>
              {(m) => <option value={m}>{m === 'ALL' ? '全部月份' : m + '月'}</option>}
            </For>
          </select>
        </div>
        <Show when={(tagList() ?? []).length}>
          <div class="px-3 pb-2.5 flex flex-wrap gap-1.5">
            <For each={tagList()}>
              {(t) => {
                const active = () => selTags().includes(t.name);
                return (
                  <button
                    onClick={() => handleTagClick(t.name)}
                    title="双击只选中此标签"
                    class={`text-xs px-2.5 py-1 rounded-full border ${
                      active()
                        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-transparent'
                    }`}
                  >
                    {t.name}
                    <span class="ml-1 opacity-60">{t.count}</span>
                  </button>
                );
              }}
            </For>
          </div>
        </Show>
      </header>

      <main class="px-3 py-3 space-y-3">
        <Show
          when={!meals.loading}
          fallback={<p class="text-center text-neutral-400 py-10">加载中…</p>}
        >
          <Show
            when={visible().length > 0}
            fallback={<p class="text-center text-neutral-400 py-10">暂无餐单</p>}
          >
            <For each={visible()}>
              {(m) => <MealCard meal={m} onClick={() => navigate(`/edit/${m.id}`)} />}
            </For>
          </Show>
        </Show>
        <div ref={sentinel} class="h-8 flex items-center justify-center">
          <Show when={hasMore()}>
            <span class="text-xs text-neutral-400">加载更多…</span>
          </Show>
          <Show when={!hasMore() && visible().length > 0}>
            <span class="text-xs text-neutral-300">— 到底了 —</span>
          </Show>
        </div>
      </main>
    </div>
  );
};

export default ListPage;
