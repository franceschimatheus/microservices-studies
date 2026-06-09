'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { restaurantFormSchema, RestaurantFormType } from '@/features/restaurants/schemas';

interface RestaurantFormProps {
  initialData?: { name: string; address: string; description?: string };
  onSubmit: (data: RestaurantFormType) => Promise<void>;
  onCancel: () => void;
  title: string;
}

export function RestaurantForm({ initialData, onSubmit, onCancel, title }: RestaurantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormType>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: initialData || { name: '', address: '', description: '' },
  });

  return (
    <div className="bg-slate-900/50 border border-slate-900/80 rounded-3xl p-6 md:p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{title}</h3>
        <button 
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</label>
          <input 
            type="text" 
            placeholder="e.g. Gourmet Burger Bistro"
            {...register('name')}
            className="bg-slate-950 border border-slate-900/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
          {errors.name && <span className="text-rose-500 text-xs font-medium">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</label>
          <input 
            type="text" 
            placeholder="e.g. 742 Evergreen Terrace, Springfield"
            {...register('address')}
            className="bg-slate-950 border border-slate-900/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
          {errors.address && <span className="text-rose-500 text-xs font-medium">{errors.address.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
          <textarea 
            placeholder="Describe the restaurant, cuisine type, active hours..."
            rows={3}
            {...register('description')}
            className="bg-slate-950 border border-slate-900/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
          />
          {errors.description && <span className="text-rose-500 text-xs font-medium">{errors.description.message}</span>}
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-xl text-sm transition-all cursor-pointer text-center"
        >
          {isSubmitting ? 'Saving...' : 'Save Restaurant'}
        </button>
      </form>
    </div>
  );
}
