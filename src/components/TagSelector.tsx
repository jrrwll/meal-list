import type { Component } from 'solid-js';
import { createSignal, createResource, For, Show } from 'solid-js';
import { listTags } from '../api/tag';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  allowCreate?: boolean;
}

const TagSelector: Component<Props> = (props) => {
  const [tags] = createResource(() => listTags().catch(() => []));
  const [editing, setEditing] = createSignal(false);
  const [input, setInput] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  const toggle = (name: string) => {
    if (props.value.includes(name)) {
      props.onChange(props.value.filter((t) => t !== name));
    } else {
      props.onChange([...props.value, name]);
    }
  };

  const commit = () => {
    const name = input().trim();
    if (name && !props.value.includes(name)) {
      props.onChange([...props.value, name]);
    }
    setInput('');
    setEditing(false);
  };

  const cancel = () => {
    setInput('');
    setEditing(false);
  };

  const startEdit = () => {
    setEditing(true);
    queueMicrotask(() => inputRef?.focus());
  };

  const allItems = (): Array<{ name: string; count?: number }> => {
    const fromApi = tags() ?? [];
    const apiNames = new Set(fromApi.map((t) => t.name));
    const extras = props.value
      .filter((v) => !apiNames.has(v))
      .map((name) => ({ name }));
    return [...fromApi, ...extras];
  };

  return (
    <div class="flex flex-wrap gap-2">
      <For each={allItems()}>
        {(t) => {
          const active = () => props.value.includes(t.name);
          return (
            <button
              type="button"
              onClick={() => toggle(t.name)}
              class={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                active()
                  ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {t.name}
              <Show when={t.count !== undefined}>
                <span class="ml-1 opacity-60">{t.count}</span>
              </Show>
            </button>
          );
        }}
      </For>

      <Show when={props.allowCreate !== false}>
        <Show
          when={editing()}
          fallback={
            <button
              type="button"
              onClick={startEdit}
              aria-label="新增标签"
              class="text-sm px-3 py-1.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-500 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 active:opacity-80"
            >
              + 新增
            </button>
          }
        >
          <span class="inline-flex items-center rounded-full border border-[#0EA5E9] bg-white dark:bg-neutral-800 pl-3 pr-1 py-0.5 focus-within:ring-2 focus-within:ring-[#0EA5E9]/30">
            <input
              ref={inputRef}
              type="text"
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              onBlur={commit}
              placeholder="标签名"
              size={6}
              class="bg-transparent outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 min-w-[3rem]"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancel}
              aria-label="取消"
              class="w-5 h-5 ml-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </span>
        </Show>
      </Show>
    </div>
  );
};

export default TagSelector;
