import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { createMeal } from '../api/meal';
import MealForm from '../components/MealForm';
import PageHeader from '../components/PageHeader';

const CreatePage: Component = () => {
    const navigate = useNavigate();
    const backEnabledAt = performance.now() + 350;
    const onBack = () => {
        // Ignore the second tap of a double-click on the home page's add button.
        if (performance.now() < backEnabledAt) return;
        navigate('/');
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <PageHeader title="创建餐单" onBack={onBack}/>
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
