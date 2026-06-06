'use client';

import React, { useState } from 'react';
import { Store, X } from 'lucide-react';

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, address: string) => Promise<void>;
}

export function AddRestaurantModal({ isOpen, onClose, onSubmit }: AddRestaurantModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    try {
      setSubmitting(true);
      await onSubmit(name, description, address);
      setName('');
      setDescription('');
      setAddress('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error registering restaurant');
    } finally {
      setSubmitting(false);
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Restaurant Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Bella Italia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Description</label>
            <textarea
              placeholder="Delicious authentic pizzas and pasta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-semibold mb-2">Address</label>
            <input
              type="text"
              required
              placeholder="123 Main St, Foodtown"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
            />
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
              disabled={submitting}
              className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
