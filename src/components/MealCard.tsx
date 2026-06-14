import type { Component } from 'solid-js';
import { Show, For } from 'solid-js';
import type { Meal } from '../api/meal';
import { formatDate } from '../utils/format';

interface Props {
  meal: Meal;
  onClick?: () => void;
}

const MealCard: Component<Props> = (props) => {
  return (
    <div
      onClick={() => props.onClick?.()}
      class="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
    >
      <Show when={props.meal.images?.[0]}>
        <div class="w-full aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-700">
          <img
            src={props.meal.images[0]}
            alt={props.meal.name}
            loading="lazy"
            class="w-full h-full object-cover"
          />
        </div>
      </Show>
      <div class="p-3">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-medium text-base text-neutral-900 dark:text-neutral-50 line-clamp-1 flex-1">
            {props.meal.name}
          </h3>
          <time class="text-xs text-neutral-500 shrink-0">{formatDate(props.meal.ctime)}</time>
        </div>
        <Show when={props.meal.tags?.length}>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <For each={props.meal.tags}>
              {(t) => (
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] dark:bg-[#082F49] dark:text-[#7DD3FC]">
                  {t}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default MealCard;
