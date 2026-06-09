'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemFormSchema, MenuItemFormType } from '@/features/restaurants/schemas';

interface MenuItemFormProps {
  initialData?: { name: string; description: string; price: number; available: boolean };
  onSubmit: (data: MenuItemFormType) => Promise<void>;
  onCancel: () => void;
  title: string;
  submitLabel: string;
  isInline?: boolean;
}

export function MenuItemForm({ initialData, onSubmit, onCancel, title, submitLabel, isInline = false }: MenuItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormType>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: initialData || { name: '', description: '', price: 0.01, available: true },
  });

  if (isInline) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-950 border border-indigo-500/20 rounded-2xl p-5 flex flex-col gap-4 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{title}</h4>
          <button 
            type="button" 
            onClick={onCancel}
            className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Name</label>
            <input 
              type="text" 
              placeholder="e.g. Classic Margherita Pizza"
              {...register('name')}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            {errors.name && <span className="text-rose-500 text-[10px]">{errors.name.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400">Price ($)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="12.99"
              {...register('price', { valueAsNumber: true })}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            {errors.price && <span className="text-rose-500 text-[10px]">{errors.price.message}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
          <input 
            type="text" 
            placeholder="e.g. Fresh tomatoes, mozzarella, basil"
            {...register('description')}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          {errors.description && <span className="text-rose-500 text-[10px]">{errors.description.message}</span>}
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-lg cursor-pointer text-center mt-2"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </form>
    );
  }

  // Standalone card form (for editing inline inside cards)
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-slate-400">Name</label>
        <input 
          type="text" 
          {...register('name')}
          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
        />
        {errors.name && <span className="text-rose-500 text-[9px]">{errors.name.message}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
        <input 
          type="text" 
          {...register('description')}
          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
        />
        {errors.description && <span className="text-rose-500 text-[9px]">{errors.description.message}</span>}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-slate-400">Price ($)</label>
          <input 
            type="number" 
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
          />
          {errors.price && <span className="text-rose-500 text-[9px]">{errors.price.message}</span>}
        </div>
        <div className="flex-1 flex flex-col gap-1 justify-end">
          <label className="inline-flex items-center cursor-pointer text-xs text-slate-300 mb-2">
            <input 
              type="checkbox" 
              {...register('available')}
              className="mr-2 rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
            />
            Available
          </label>
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
        >
          {isSubmitting ? '...' : 'Save'}
        </button>
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold py-2 rounded-lg cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
