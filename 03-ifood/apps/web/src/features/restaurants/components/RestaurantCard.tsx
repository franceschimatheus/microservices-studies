'use client';

import React from 'react';
import { Store, MapPin, ArrowRight } from 'lucide-react';
import { RestaurantType } from '../schemas';

interface RestaurantCardProps {
  restaurant: RestaurantType;
  onClick: () => void;
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-slate-900 border border-slate-900/80 rounded-3xl p-6 hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300 shadow-lg flex flex-col justify-between cursor-pointer group"
    >
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-red-950/30 text-red-500 rounded-2xl border border-red-900/30 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold truncate">{restaurant.name}</h3>
        </div>
        <p className="text-slate-400 text-sm line-clamp-3 mb-4 min-h-[60px] leading-relaxed">
          {restaurant.description || 'No description provided.'}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-900/80 pt-4 mt-2">
        <div className="flex items-center gap-2 text-slate-500 text-xs truncate max-w-[70%]">
          <MapPin className="w-4 h-4 shrink-0 text-red-500/70" />
          <span className="truncate">{restaurant.address}</span>
        </div>
        <span className="text-xs font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 shrink-0">
          View Menu <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
