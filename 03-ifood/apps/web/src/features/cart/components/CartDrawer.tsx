'use client';

import React, { useState } from 'react';
import { ShoppingCart, X, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { CartType } from '../schemas/cartSchema';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartType | null;
  loading: boolean;
  restaurantId: string | null;
  onRemoveItem: (itemId: string) => Promise<CartType | void>;
  onClearCart: () => Promise<void>;
  onCheckout: (restaurantId: string) => Promise<void>;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  loading,
  restaurantId,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartDrawerProps) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!restaurantId) {
      setCheckoutError('No restaurant selected. Add items from a restaurant first.');
      return;
    }
    try {
      setCheckingOut(true);
      setCheckoutError(null);
      await onCheckout(restaurantId);
      setOrderPlaced(true);
      // Auto-close after success
      setTimeout(() => {
        setOrderPlaced(false);
        onClose();
      }, 2200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      setCheckoutError(message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-8 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250"
      >
        <div>
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-red-500 w-6 h-6" />
              Your Cart
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Order placed success state */}
          {orderPlaced ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
              <h4 className="text-xl font-bold text-green-400 mb-2">Order Placed!</h4>
              <p className="text-slate-400 text-sm max-w-[220px] leading-relaxed">
                Your order was sent successfully. Check <strong>My Orders</strong> for status updates.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-700" />
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-xs max-w-[200px] mt-1 leading-normal">
                Explore restaurants and add delicious items to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-2">
              {cart.items.map((item) => (
                <div
                  key={item.menu_item_id}
                  className="flex justify-between items-center bg-slate-950 border border-slate-850 p-4 rounded-2xl"
                >
                  <div className="max-w-[60%]">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <div className="flex gap-2.5 text-xs text-slate-400 mt-1">
                      <span>${item.price.toFixed(2)}</span>
                      <span>×</span>
                      <span className="font-bold text-slate-300">{item.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-red-500 text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.menu_item_id)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-red-900/50 hover:text-red-500 text-slate-450 rounded-xl cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!orderPlaced && cart && cart.items.length > 0 && (
          <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
            {checkoutError && (
              <p className="text-red-400 text-xs text-center bg-red-950/30 border border-red-900/40 rounded-xl py-2 px-3">
                {checkoutError}
              </p>
            )}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-red-500 text-2xl font-black">
                ${cart.total_price.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onClearCart}
                disabled={checkingOut}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl transition-all cursor-pointer text-center text-sm border border-slate-800 disabled:opacity-50"
              >
                Clear Cart
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkingOut || !restaurantId}
                className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all cursor-pointer text-center text-sm shadow-lg shadow-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
