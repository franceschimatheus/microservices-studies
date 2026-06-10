'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { restaurantFormSchema, RestaurantFormType } from '@/features/restaurants/schemas';
import { Store, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, address: string) => Promise<void>;
}

export function AddRestaurantModal({ isOpen, onClose, onSubmit }: AddRestaurantModalProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantFormType>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: { name: '', description: '', address: '' },
  });

  if (!isOpen) return null;

  const onFormSubmit = async (data: RestaurantFormType) => {
    try {
      await onSubmit(data.name, data.description || '', data.address);
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error registering restaurant';
      toast(message, 'error', 'Registration Failed');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Store className="text-red-500 w-6 h-6" />
          Register New Restaurant
        </h3>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Restaurant Name</label>
            <input
              type="text"
              placeholder="e.g., Bella Italia"
              {...register('name')}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
            />
            {errors.name && <span className="text-rose-500 text-xs font-medium mt-1 block">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Description</label>
            <textarea
              placeholder="Delicious authentic pizzas and pasta..."
              rows={3}
              {...register('description')}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all resize-none"
            />
            {errors.description && <span className="text-rose-500 text-xs font-medium mt-1 block">{errors.description.message}</span>}
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Address</label>
            <input
              type="text"
              placeholder="123 Main St, Foodtown"
              {...register('address')}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
            />
            {errors.address && <span className="text-rose-500 text-xs font-medium mt-1 block">{errors.address.message}</span>}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
