'use client';

import React from 'react';
import { Package, X, Clock, ChefHat, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { Order, OrderStatus } from '../schemas/orderSchema';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-800/40',   Icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-400',    bg: 'bg-blue-950/40 border-blue-800/40',     Icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', color: 'text-orange-400',  bg: 'bg-orange-950/40 border-orange-800/40', Icon: ChefHat },
  DELIVERED: { label: 'Delivered', color: 'text-green-400',   bg: 'bg-green-950/40 border-green-800/40',   Icon: Truck },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400',     bg: 'bg-red-950/40 border-red-800/40',       Icon: XCircle },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const { label, color, bg, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersDrawer({ isOpen, onClose, orders, loading, onRefresh }: OrdersDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-red-500 w-6 h-6" />
            My Orders
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              Refresh
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-center">
              <Package className="w-14 h-14 mb-4 text-slate-700" />
              <p className="font-semibold text-base">No orders yet</p>
              <p className="text-sm mt-1 max-w-[220px] leading-relaxed text-slate-600">
                Browse restaurants, add items to your cart, and place your first order!
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                {/* Order header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-slate-300 truncate max-w-[55%]">
                          <span className="text-slate-500 mr-1">{item.quantity}×</span>
                          {item.name}
                        </span>
                        <span className="text-slate-400 font-medium shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                  <span className="text-red-500 font-black text-base">
                    ${order.total_price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
