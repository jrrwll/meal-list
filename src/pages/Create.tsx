import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { createMeal } from '../api/meal';
import MealForm from '../components/MealForm';
import PageHeader from '../components/PageHeader';

const CreatePage: Component = () => {
  const navigate = useNavigate();
  return (
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <PageHeader title="创建餐单" onBack={() => navigate('/')} />
      <div class="p-4">
        <MealForm
          submitText="创建"
          onSubmit={async (input) => {
            await createMeal(input);
            navigate('/');
          }}
        />
      </div>
    </div>
  );
};

export default CreatePage;
