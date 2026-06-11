'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurantsQuery } from '@/features/restaurants/queries/useRestaurantsQuery';
import { useCategoriesQuery } from '@/features/restaurants/queries/useCategoriesQuery';
import { useMenuQuery } from '@/features/restaurants/queries/useMenuQuery';
import { useCartQuery } from '@/features/cart/queries/useCartQuery';
import { useAddToCartMutation } from '@/features/cart/queries/useAddToCartMutation';
import { useClearCartMutation } from '@/features/cart/queries/useClearCartMutation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Store, MapPin, ChevronLeft, Plus, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const router = useRouter();
  const { id: restaurantId } = use(params);

  // Queries & Mutations using React Query
  const { data: restaurants = [] } = useRestaurantsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery(restaurantId);
  const { data: menuItems = [], isLoading: menuLoading } = useMenuQuery(restaurantId);
  const { data: cart } = useCartQuery();
  const { mutateAsync: addToCart } = useAddToCartMutation();
  const { mutateAsync: clearCart } = useClearCartMutation();

  const restaurant = restaurants.find((r) => r.id === restaurantId);

  // Cart change restaurant confirm modal state
  const [cartConfirm, setCartConfirm] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; price: number } | null>(null);

  const handleAddToCart = async (item: { id: string; name: string; price: number }) => {
    if (!restaurant) return;
    const existingRestaurantId = cart?.restaurant_id;
    if (existingRestaurantId && existingRestaurantId !== restaurant.id && (cart?.items?.length ?? 0) > 0) {
      setPendingItem(item);
      setCartConfirm(true);
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
    if (pendingItem && restaurant) {
      await clearCart();
      await addToCart({
        menu_item_id: pendingItem.id,
        restaurant_id: restaurant.id,
        name: pendingItem.name,
        price: pendingItem.price,
        quantity: 1,
      });
      setPendingItem(null);
    }
    setCartConfirm(false);
  };

  const handleCartCancel = () => {
    setPendingItem(null);
    setCartConfirm(false);
  };

  if (menuLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-32 text-slate-400 gap-3">
        <svg className="animate-spin h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium">Loading restaurant menu...</span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
        <button
          onClick={() => router.push('/customer')}
          className="bg-red-650 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all cursor-pointer"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  // Group menu items by category
  const menuByCategory = categories.reduce<Record<string, typeof menuItems>>((acc, cat) => {
    acc[cat.name] = menuItems.filter((item) => item.category_id === cat.id);
    return acc;
  }, {});

  // Get items without a category
  const uncategorizedItems = menuItems.filter(
    (item) => !categories.some((cat) => cat.id === item.category_id)
  );
  if (uncategorizedItems.length > 0) {
    menuByCategory['General'] = uncategorizedItems;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/customer')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium text-sm cursor-pointer group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Restaurants
        </button>
      </div>

      {/* Restaurant Header Info */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Store className="text-red-500 w-8 h-8" />
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{restaurant.name}</h1>
          </div>
          <p className="text-slate-400 text-base mb-4 max-w-2xl leading-relaxed">
            {restaurant.description || 'No description provided.'}
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <MapPin className="w-4 h-4 text-red-500/70" />
            <span>{restaurant.address}</span>
          </div>
        </div>
      </div>

      {/* Menu / Categories list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar categories navigation */}
        <div className="hidden lg:block space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Categories</h3>
          {Object.keys(menuByCategory).map((catName) => (
            <a
              key={catName}
              href={`#category-${catName}`}
              className="block px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all text-sm font-medium"
            >
              {catName}
            </a>
          ))}
        </div>

        {/* Categories and menu items */}
        <div className="lg:col-span-3 space-y-12">
          {Object.keys(menuByCategory).length === 0 ? (
            <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl max-w-xl mx-auto flex flex-col items-center">
              <UtensilsCrossed className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-lg font-bold mb-1">No items available</h3>
              <p className="text-slate-400 text-sm">
                This restaurant hasn&apos;t added any menu items yet.
              </p>
            </div>
          ) : (
            Object.entries(menuByCategory).map(([catName, items]) => (
              <div key={catName} id={`category-${catName}`} className="space-y-6 scroll-mt-6">
                <h2 className="text-xl font-bold border-b border-slate-900 pb-3 text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                  {catName}
                </h2>
                {items.length === 0 ? (
                  <p className="text-slate-500 text-sm italic pl-4">No items in this category.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className={`flex justify-between items-center transition-all ${
                          item.available ? 'opacity-100 hover:border-slate-800' : 'opacity-60'
                        }`}
                      >
                        <div className="max-w-[70%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-base">{item.name}</h4>
                            {!item.available && (
                              <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full font-bold">
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
                            onClick={() => handleAddToCart(item)}
                            className={`p-2.5 rounded-xl shadow-md transition-all active:scale-95 ${
                              item.available
                                ? 'bg-red-650 hover:bg-red-700 text-white cursor-pointer'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                            title={item.available ? 'Add to cart' : 'Item unavailable'}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Change Restaurant Confirm Modal */}
      <ConfirmModal
        isOpen={cartConfirm}
        onClose={handleCartCancel}
        onConfirm={handleCartConfirm}
        title="Replace cart items?"
        message={`Your cart has items from a different restaurant.\n\nAdding from "${restaurant.name}" will clear your current cart.`}
        confirmLabel="Clear & Add"
        cancelLabel="Keep Cart"
        variant="warning"
      />
    </div>
  );
}
