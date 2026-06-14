import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import type { Meal, MealInput } from '../api/meal';
import ImageUploader from './ImageUploader';
import TagSelector from './TagSelector';

interface Props {
  initial?: Meal;
  submitText: string;
  onSubmit: (input: MealInput) => Promise<void>;
}

const MealForm: Component<Props> = (props) => {
  const [name, setName] = createSignal(props.initial?.name ?? '');
  const [description, setDescription] = createSignal(props.initial?.description ?? '');
  const [images, setImages] = createSignal<string[]>(props.initial?.images ?? []);
  const [tags, setTags] = createSignal<string[]>(props.initial?.tags ?? []);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const submit = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!name().trim()) {
      setError('请输入餐单名称');
      return;
    }
    if (images().length === 0) {
      setError('请至少上传一张图片');
      return;
    }
    setSubmitting(true);
    try {
      await props.onSubmit({
        id: props.initial?.id,
        name: name().trim(),
        description: description(),
        images: images(),
        tags: tags(),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
          名称
        </label>
        <input
          type="text"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          placeholder="今日吃了啥"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
          描述
        </label>
        <textarea
          rows={3}
          value={description()}
          onInput={(e) => setDescription(e.currentTarget.value)}
          class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-base resize-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
          placeholder="味道、做法、心情…"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
          图片 <span class="text-red-500">*</span> ({images().length}/9)
        </label>
        <ImageUploader value={images()} onChange={setImages} max={9} />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5">
          标签
        </label>
        <TagSelector value={tags()} onChange={setTags} />
      </div>

      <Show when={error()}>
        <p class="text-sm text-red-500">{error()}</p>
      </Show>

      <button
        type="submit"
        disabled={submitting()}
        class="w-full py-3 rounded-xl bg-[#0EA5E9] text-white font-medium text-base active:opacity-80 disabled:opacity-60"
      >
        {submitting() ? '提交中…' : props.submitText}
      </button>
    </form>
  );
};

export default MealForm;
