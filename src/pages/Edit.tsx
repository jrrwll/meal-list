import type { Component } from 'solid-js';
import { createResource, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { listMeals, updateMeal } from '../api/meal';
import MealForm from '../components/MealForm';
import PageHeader from '../components/PageHeader';

const EditPage: Component = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const [meal] = createResource(
    () => params.id,
    async (id) => {
      const all = await listMeals();
      return all.find((m) => m.id === id);
    },
  );

  return (
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <PageHeader title="编辑餐单" onBack={() => navigate('/')} />
      <div class="p-4">
        <Show
          when={!meal.loading}
          fallback={<p class="text-center text-neutral-400 py-10">加载中…</p>}
        >
          <Show
            when={meal()}
            fallback={<p class="text-center text-neutral-400 py-10">餐单不存在</p>}
          >
            <MealForm
              initial={meal()!}
              submitText="保存"
              onSubmit={async (input) => {
                await updateMeal(input);
                navigate('/');
              }}
            />
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default EditPage;
