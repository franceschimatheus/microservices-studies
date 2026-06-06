'use client';

import React from 'react';
import { Store, X, Plus } from 'lucide-react';
import { Restaurant } from '../hooks/useRestaurants';

interface MockMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface MenuModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onAddToCart: (item: MockMenuItem) => Promise<void>;
}

export function MenuModal({ restaurant, onClose, onAddToCart }: MenuModalProps) {
  if (!restaurant) return null;

  // Generate Menu Items for the selected restaurant
  const getMockMenu = (restaurantName: string): MockMenuItem[] => {
    const isPizza = restaurantName.toLowerCase().includes('pizza') || restaurantName.toLowerCase().includes('italia') || restaurantName.toLowerCase().includes('mama');
    const isSushi = restaurantName.toLowerCase().includes('sushi') || restaurantName.toLowerCase().includes('zen') || restaurantName.toLowerCase().includes('asia');

    if (isPizza) {
      return [
        { id: 'p1', name: 'Margherita Pizza', description: 'Fresh tomatoes, mozzarella, basil and olive oil.', price: 12.99 },
        { id: 'p2', name: 'Pepperoni Pizza', description: 'Double pepperoni, loaded cheese, and tomato sauce.', price: 14.99 },
        { id: 'p3', name: 'Garlic Parmesan Breadsticks', description: 'Baked fresh with marinara dipping sauce.', price: 5.99 },
        { id: 'p4', name: 'Tiramisu', description: 'Classic Italian dessert with espresso-dipped ladyfingers.', price: 6.99 }
      ];
    } else if (isSushi) {
      return [
        { id: 's1', name: 'Salmon Sashimi (5pcs)', description: 'Slices of raw premium fresh salmon.', price: 11.99 },
        { id: 's2', name: 'California Roll (8pcs)', description: 'Crab meat, avocado, cucumber, and sesame seeds.', price: 9.99 },
        { id: 's3', name: 'Dragon Roll', description: 'Eel and cucumber inside, avocado and unagi sauce on top.', price: 15.99 },
        { id: 's4', name: 'Matcha Ice Cream', description: 'Creamy green tea flavoured ice cream scoop.', price: 4.99 }
      ];
    } else {
      return [
        { id: 'm1', name: 'Classic Cheeseburger', description: 'Flame-grilled patty, cheddar, lettuce, tomato and special sauce.', price: 10.99 },
        { id: 'm2', name: 'Crispy French Fries', description: 'Golden salted cut potatoes served hot.', price: 3.99 },
        { id: 'm3', name: 'Chocolate Milkshake', description: 'Thick whipped chocolate malted shake.', price: 5.49 }
      ];
    }
  };

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

        <div className="flex items-center gap-3 mb-4">
          <Store className="text-red-500 w-8 h-8" />
          <h2 className="text-3xl font-extrabold tracking-tight">{restaurant.name}</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-800">{restaurant.description}</p>

        <h3 className="text-lg font-bold mb-4">Menu Items</h3>
        <div className="space-y-4">
          {getMockMenu(restaurant.name).map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-slate-950 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition-colors">
              <div className="max-w-[70%]">
                <h4 className="font-bold text-base">{item.name}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-red-500 text-base">${item.price.toFixed(2)}</span>
                <button
                  onClick={() => onAddToCart(item)}
                  className="p-2 bg-red-650 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
