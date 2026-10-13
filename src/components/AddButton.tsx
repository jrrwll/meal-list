import type { Component } from 'solid-js';

interface Props {
  onClick: () => void;
}

const AddButton: Component<Props> = (props) => {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
        aria-label="新增餐单"
        class="w-10 h-10 shrink-0 rounded-full bg-white text-[#0284C7] text-2xl leading-none flex items-center justify-center shadow-sm active:opacity-80"
      >
      +
    </button>
  );
};

export default AddButton;
