import type { Component } from 'solid-js';

interface Props {
  title: string;
  onBack: () => void;
}

const PageHeader: Component<Props> = (props) => {
  return (
    <header class="sticky top-0 z-10 bg-[#0EA5E9] dark:bg-[#1a1a1a] flex items-center px-2 py-3 shadow-sm">
      <button
        onClick={() => props.onBack()}
        class="w-10 h-10 flex items-center justify-center text-white dark:text-neutral-100 text-xl"
        aria-label="返回"
      >
        ‹
      </button>
      <h1 class="flex-1 text-center text-base font-medium text-white dark:text-neutral-100">
        {props.title}
      </h1>
      <div class="w-10" />
    </header>
  );
};

export default PageHeader;
