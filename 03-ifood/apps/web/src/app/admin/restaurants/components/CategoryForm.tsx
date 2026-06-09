'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryFormSchema, CategoryFormType } from '@/features/restaurants/schemas';

interface CategoryFormProps {
  onSubmit: (data: CategoryFormType) => Promise<void>;
}

export function CategoryForm({ onSubmit }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormType>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '' },
  });

  const handleFormSubmit = async (data: CategoryFormType) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-1 w-full md:w-auto">
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Category name (e.g. Pasta)"
          {...register('name')}
          className="bg-slate-950 border border-slate-900/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all w-full md:w-48"
        />
        <button 
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all whitespace-nowrap"
        >
          {isSubmitting ? '...' : '+ Category'}
        </button>
      </div>
      {errors.name && <span className="text-rose-500 text-[10px] font-medium">{errors.name.message}</span>}
    </form>
  );
}
