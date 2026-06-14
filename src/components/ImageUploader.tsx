import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { uploadFile } from '../api/file';
import ImageViewer from './ImageViewer';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}

const ImageUploader: Component<Props> = (props) => {
  const max = () => props.max ?? 9;
  const [uploading, setUploading] = createSignal(false);
  const [viewerOpen, setViewerOpen] = createSignal(false);
  const [viewerIdx, setViewerIdx] = createSignal(0);
  let fileInput: HTMLInputElement | undefined;

  const onPick = async (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    if (props.value.length >= max()) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      props.onChange([...props.value, url]);
    } catch (err) {
      alert('上传失败：' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const remove = (i: number) => {
    props.onChange(props.value.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div class="grid grid-cols-3 gap-2">
        <For each={props.value}>
          {(url, i) => (
            <div class="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
              <img
                src={url}
                class="w-full h-full object-cover cursor-pointer"
                onClick={() => {
                  setViewerIdx(i());
                  setViewerOpen(true);
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i());
                }}
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </For>
        <Show when={props.value.length < max()}>
          <button
            type="button"
            disabled={uploading()}
            onClick={() => fileInput?.click()}
            class="aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center text-neutral-400 active:bg-neutral-50 dark:active:bg-neutral-700"
          >
            <Show when={!uploading()} fallback={<span class="text-xs">上传中…</span>}>
              <span class="text-2xl leading-none">+</span>
              <span class="text-xs mt-1">
                {props.value.length}/{max()}
              </span>
            </Show>
          </button>
        </Show>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        class="hidden"
        onChange={onPick}
      />
      <ImageViewer
        images={props.value}
        index={viewerIdx()}
        open={viewerOpen()}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
};

export default ImageUploader;
