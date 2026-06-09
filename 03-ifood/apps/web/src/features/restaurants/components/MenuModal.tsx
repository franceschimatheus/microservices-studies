'use client';

import React, { useEffect, useState } from 'react';
import { Store, X, Plus, Loader2 } from 'lucide-react';
import { RestaurantType, MenuItemType, menuItemSchema } from '../schemas';
import { z } from 'zod';

interface MenuModalProps {
  restaurant: RestaurantType | null;
  onClose: () => void;
  onAddToCart: (item: { id: string; name: string; price: number }) => Promise<void>;
}

const GATEWAY_URL = 'http://localhost:8085';

export function MenuModal({ restaurant, onClose, onAddToCart }: MenuModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;

    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurant.id}/menu`);
        if (!res.ok) throw new Error('Failed to load menu');
        const data = await res.json();
        const parsed = z.array(menuItemSchema).parse(data || []);
        setMenuItems(parsed);
      } catch (err: any) {
        setError(err.message || 'Error loading menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurant]);

  if (!restaurant) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Store className="text-red-500 w-8 h-8" />
          <h2 className="text-3xl font-extrabold tracking-tight">{restaurant.name}</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-800">
          {restaurant.description || 'No description.'}
        </p>

        <h3 className="text-lg font-bold mb-4">Menu</h3>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading menu...</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && menuItems.length === 0 && (
          <div className="text-slate-500 text-sm text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            No menu items available for this restaurant yet.
          </div>
        )}

        {!loading && !error && menuItems.length > 0 && (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`flex justify-between items-center bg-slate-950 border rounded-2xl p-4 transition-colors ${
                  item.available
                    ? 'border-slate-850 hover:border-slate-800'
                    : 'border-slate-900 opacity-60'
                }`}
              >
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base">{item.name}</h4>
                    {!item.available && (
                      <span className="text-[10px] bg-rose-950/40 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded-full font-bold">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                    {item.description || 'No description.'}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-black text-red-500 text-base">${item.price.toFixed(2)}</span>
                  <button
                    disabled={!item.available}
                    onClick={() => onAddToCart({ id: item.id, name: item.name, price: item.price })}
                    className={`p-2 rounded-xl shadow-md transition-all active:scale-95 ${
                      item.available
                        ? 'bg-red-650 hover:bg-red-700 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                    title={item.available ? 'Add to cart' : 'Item unavailable'}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
