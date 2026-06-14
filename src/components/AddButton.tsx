import type { Component } from 'solid-js';

interface Props {
  onSingle: () => void;
  onDouble: () => void;
}

const AddButton: Component<Props> = (props) => {
  let timer: number | undefined;
  const DELAY = 260;

  const onClick = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
      props.onDouble();
      return;
    }
    timer = window.setTimeout(() => {
      timer = undefined;
      props.onSingle();
    }, DELAY);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="新增 (双击进入设置)"
      class="w-10 h-10 rounded-full bg-white text-[#0284C7] text-2xl leading-none flex items-center justify-center shadow-sm active:opacity-80"
    >
      +
    </button>
  );
};

export default AddButton;
