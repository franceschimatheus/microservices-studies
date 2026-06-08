import React from 'react';
import { Store, Utensils } from 'lucide-react';
import { RestaurantCard } from '@/features/restaurants/components/RestaurantCard';
import { Restaurant } from '@/features/restaurants/hooks/useRestaurants';

interface SearchResultsProps {
  searchResults: {
    restaurants: Restaurant[];
    menu_items: any[];
  };
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onAddToCart: (item: { id: string; name: string; price: number }, restaurant: Restaurant) => Promise<void>;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  restaurants,
  onSelectRestaurant,
  onAddToCart,
}) => {
  return (
    <div className="space-y-10 mb-10">
      {/* Restaurant Results */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Store className="text-red-500 w-6 h-6" />
          Restaurants ({searchResults.restaurants?.length || 0})
        </h2>
        {!searchResults.restaurants || searchResults.restaurants.length === 0 ? (
          <p className="text-slate-500 text-sm italic bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            No matching restaurants found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(searchResults.restaurants || []).map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => onSelectRestaurant(restaurant)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Menu Item Results */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Utensils className="text-red-500 w-6 h-6" />
          Menu Items ({searchResults.menu_items?.length || 0})
        </h2>
        {!searchResults.menu_items || searchResults.menu_items.length === 0 ? (
          <p className="text-slate-500 text-sm italic bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
            No matching dishes found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(searchResults.menu_items || []).map((item) => {
              const parentRest = restaurants.find((r) => r.id === item.restaurant_id) || {
                id: item.restaurant_id,
                name: 'Restaurant',
                description: '',
                address: '',
                created_at: '',
              };
              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-3xl p-6 flex justify-between items-center transition-all duration-200"
                >
                  <div className="space-y-2 flex-1 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-lg">{item.name}</span>
                      <span className="text-[10px] bg-slate-855 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-lg font-extrabold uppercase tracking-wider">
                        {parentRest.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                    <span className="inline-block font-black text-base text-red-500">${item.price.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={!item.available}
                    onClick={() => onAddToCart({ id: item.id, name: item.name, price: item.price }, parentRest)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg ${
                      item.available
                        ? 'bg-red-650 hover:bg-red-700 text-white shadow-red-900/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    }`}
                  >
                    {item.available ? 'Add to Cart' : 'Sold Out'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
