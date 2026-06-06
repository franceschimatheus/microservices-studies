'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import { useRestaurants } from '@/features/restaurants/hooks/useRestaurants';
import { useCart } from '@/features/cart/hooks/useCart';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { RestaurantCard } from '@/features/restaurants/components/RestaurantCard';
import { MenuModal } from '@/features/restaurants/components/MenuModal';
import { AddRestaurantModal } from '@/features/restaurants/components/AddRestaurantModal';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { OrdersDrawer } from '@/features/orders/components/OrdersDrawer';
import { Restaurant } from '@/features/restaurants/hooks/useRestaurants';
import { Store, Plus, Utensils, ShoppingCart, Package } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Feature hooks
  const { restaurants, loading: restaurantsLoading, error: restaurantsError, createRestaurant } = useRestaurants();
  const { cart, loading: cartLoading, addItem, removeItem, clearCart, checkout } = useCart();
  const { orders, loading: ordersLoading, fetchOrders, placeOrder } = useOrders();

  // Track which restaurant the current cart belongs to
  // (derived from cart.restaurant_id returned by the API — no local state needed)

  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (
        user.role === 'admin' &&
        typeof window !== 'undefined' &&
        localStorage.getItem('admin_view_mode') !== 'customer'
      ) {
        router.push('/admin');
      }
    }
  }, [user, authLoading, router]);

  const switchToAdminView = () => {
    localStorage.removeItem('admin_view_mode');
    router.push('/admin');
  };

  const isAdminViewingAsCustomer =
    user?.role === 'admin' &&
    typeof window !== 'undefined' &&
    localStorage.getItem('admin_view_mode') === 'customer';

  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleOpenOrders = async () => {
    await fetchOrders();
    setIsOrdersOpen(true);
  };

  const handleCheckout = async (restaurantId: string) => {
    await checkout(restaurantId, placeOrder);
  };

  // Detect cross-restaurant conflict when adding items
  const handleAddToCart = async (item: { id: string; name: string; price: number }, restaurant: Restaurant) => {
    const existingRestaurantId = cart?.restaurant_id;
    if (existingRestaurantId && existingRestaurantId !== restaurant.id && (cart?.items?.length ?? 0) > 0) {
      const confirmed = window.confirm(
        `Your cart has items from a different restaurant.\n\nAdding from "${restaurant.name}" will clear your current cart.\n\nContinue?`
      );
      if (!confirmed) return;
      await clearCart();
    }
    await addItem({
      menu_item_id: item.id,
      restaurant_id: restaurant.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  if (authLoading || !user || (user.role !== 'customer' && !isAdminViewingAsCustomer)) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-medium text-sm">Validating session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans relative">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

      {/* Floating action buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3 items-end">
        {/* Orders button */}
        <button
          onClick={handleOpenOrders}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2"
          title="My Orders"
        >
          <Package className="w-5 h-5 text-slate-300" />
        </button>

        {/* Cart button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2"
          title="Your Cart"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="bg-white text-red-600 text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      <main className="flex-1 p-10 max-w-7xl w-full mx-auto">
        {isAdminViewingAsCustomer && (
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 mb-6 flex justify-between items-center text-amber-200 text-sm">
            <span>🛡️ You are currently viewing the customer interface as an <strong>Admin</strong>.</span>
            <button
              onClick={switchToAdminView}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-4 rounded-lg transition-all cursor-pointer"
            >
              Back to Admin Panel
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-10 mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              Welcome back, <span className="text-red-500">{user.email.split('@')[0]}</span>! 👋
            </h1>
            <p className="text-slate-400 text-lg">
              Hungry? Explore local restaurants, order meals, and track your delivery in real-time.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-red-650 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-red-900/30"
          >
            <Plus className="w-5 h-5" />
            Add Restaurant
          </button>
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Utensils className="text-red-500 w-6 h-6" />
              Featured Restaurants
            </h2>
          </div>

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
              {restaurantsError}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
              <Store className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold mb-2">No restaurants available</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Be the first to register a new restaurant in our platform to browse their menus.
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
              >
                Register a Restaurant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => setSelectedRestaurant(restaurant)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createRestaurant}
      />

      {/* Selected Restaurant Menu Modal */}
      <MenuModal
        restaurant={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        onAddToCart={async (item) => {
          if (selectedRestaurant) {
            await handleAddToCart(item, selectedRestaurant);
          }
        }}
      />

      {/* Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        loading={cartLoading}
        restaurantId={cart?.restaurant_id || null}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />

      {/* Orders Drawer */}
      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        loading={ordersLoading}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
