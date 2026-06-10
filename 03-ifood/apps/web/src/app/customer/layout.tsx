'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import { useCartQuery } from '@/features/cart/queries/useCartQuery';
import { useRemoveFromCartMutation } from '@/features/cart/queries/useRemoveFromCartMutation';
import { useClearCartMutation } from '@/features/cart/queries/useClearCartMutation';
import { usePlaceOrderMutation } from '@/features/orders/queries/usePlaceOrderMutation';
import { useOrderStream } from '@/features/orders/queries/useOrderStream';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { ShoppingCart } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Global SSE status subscription for all customer pages
  useOrderStream();

  // Cart query and mutations
  const { data: cart, isLoading: cartLoading } = useCartQuery();
  const { mutateAsync: removeItem } = useRemoveFromCartMutation();
  const { mutateAsync: clearCart } = useClearCartMutation();
  const { mutateAsync: placeOrder } = usePlaceOrderMutation();

  // Local Zustand cart drawer UI store
  const { isCartOpen, setCartOpen } = useCartStore();

  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleCheckout = async (restaurantId: string) => {
    await placeOrder(restaurantId);
    setCartOpen(false);
    router.push('/customer/profile');
  };

  React.useEffect(() => {
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

  const isAdminViewingAsCustomer =
    user?.role === 'admin' &&
    typeof window !== 'undefined' &&
    localStorage.getItem('admin_view_mode') === 'customer';

  const switchToAdminView = () => {
    localStorage.removeItem('admin_view_mode');
    router.push('/admin');
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

      {/* Floating Cart Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setCartOpen(true)}
          className="bg-red-650 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2"
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

        {children}
      </main>

      {/* Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart || null}
        loading={cartLoading}
        restaurantId={cart?.restaurant_id || null}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
