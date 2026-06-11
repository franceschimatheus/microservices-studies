'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurantsQuery } from '@/features/restaurants/queries/useRestaurantsQuery';
import { useCartQuery } from '@/features/cart/queries/useCartQuery';
import { useAddToCartMutation } from '@/features/cart/queries/useAddToCartMutation';
import { useClearCartMutation } from '@/features/cart/queries/useClearCartMutation';
import { RestaurantCard } from '@/features/restaurants/components/RestaurantCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RestaurantType } from '@/features/restaurants/schemas';
import { Store, Utensils } from 'lucide-react';
import { SearchBar } from '@/features/search/components/SearchBar';
import { SearchResults } from '@/features/search/components/SearchResults';
import { useSearchQuery } from '@/features/search/queries/useSearchQuery';

export default function CustomerDashboard() {
  const router = useRouter();

  // Queries & Mutations using TanStack Query
  const { data: restaurants = [], isLoading: restaurantsLoading, error: restaurantsError } = useRestaurantsQuery();
  const { data: cart } = useCartQuery();
  const { mutateAsync: addToCart } = useAddToCartMutation();
  const { mutateAsync: clearCart } = useClearCartMutation();

  // Cart change restaurant confirm modal state
  const [cartConfirm, setCartConfirm] = useState<{ restaurantName: string } | null>(null);
  const pendingCartAction = useRef<(() => Promise<void>) | null>(null);

  // Search state & query hook
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searchLoading } = useSearchQuery(searchQuery);

  const handleSelectRestaurant = (restaurant: RestaurantType) => {
    router.push(`/customer/restaurants/${restaurant.id}`);
  };

  const handleAddToCart = async (item: { id: string; name: string; price: number }, restaurant: RestaurantType) => {
    const existingRestaurantId = cart?.restaurant_id;
    if (existingRestaurantId && existingRestaurantId !== restaurant.id && (cart?.items?.length ?? 0) > 0) {
      pendingCartAction.current = async () => {
        await clearCart();
        await addToCart({
          menu_item_id: item.id,
          restaurant_id: restaurant.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        });
      };
      setCartConfirm({ restaurantName: restaurant.name });
      return;
    }
    await addToCart({
      menu_item_id: item.id,
      restaurant_id: restaurant.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  const handleCartConfirm = async () => {
    if (pendingCartAction.current) {
      await pendingCartAction.current();
      pendingCartAction.current = null;
    }
    setCartConfirm(null);
  };

  const handleCartCancel = () => {
    pendingCartAction.current = null;
    setCartConfirm(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-10 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-white">
            Hungry? Let&apos;s find some food! 🍔
          </h1>
          <p className="text-slate-400 text-lg">
            Explore local restaurants, order meals, and track your delivery in real-time.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        searchLoading={searchLoading}
        onSearch={setSearchQuery}
      />

      {searchResults ? (
        <SearchResults
          searchResults={searchResults}
          restaurants={restaurants}
          onSelectRestaurant={handleSelectRestaurant}
          onAddToCart={handleAddToCart}
        />
      ) : (
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-white">
            <Utensils className="text-red-500 w-6 h-6" />
            Featured Restaurants
          </h2>

          {restaurantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-48 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 bg-slate-800 rounded-lg w-2/3" />
                    <div className="h-4 bg-slate-800 rounded-lg w-full" />
                    <div className="h-4 bg-slate-800 rounded-lg w-4/5" />
                  </div>
                  <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : restaurantsError ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 text-red-400 text-center">
              Failed to load restaurants. Please try again.
            </div>
          ) : restaurants.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
              <Store className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold mb-2">No restaurants available</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                We couldn&apos;t find any restaurants at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => handleSelectRestaurant(restaurant)}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* Cart Change Restaurant Confirm Modal */}
      <ConfirmModal
        isOpen={!!cartConfirm}
        onClose={handleCartCancel}
        onConfirm={handleCartConfirm}
        title="Replace cart items?"
        message={`Your cart has items from a different restaurant.\n\nAdding from "${cartConfirm?.restaurantName}" will clear your current cart.`}
        confirmLabel="Clear & Add"
        cancelLabel="Keep Cart"
        variant="warning"
      />
    </div>
  );
}
