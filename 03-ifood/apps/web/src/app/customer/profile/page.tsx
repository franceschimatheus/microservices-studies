'use client';

import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOrdersQuery } from '@/features/orders/queries/useOrdersQuery';
import { useRestaurantsQuery } from '@/features/restaurants/queries/useRestaurantsQuery';
import { Package, Clock, ChefHat, CheckCircle2, XCircle, Truck, User as UserIcon, Calendar, DollarSign } from 'lucide-react';
import { OrderStatusType } from '@/features/orders/schemas/orderSchema';
import { Card } from '@/components/ui/Card';

const STATUS_CONFIG: Record<OrderStatusType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PENDING:     { label: 'Pending',     color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-800/40',   Icon: Clock },
  CONFIRMED:   { label: 'Confirmed',   color: 'text-blue-400',    bg: 'bg-blue-950/40 border-blue-800/40',     Icon: CheckCircle2 },
  PREPARING:   { label: 'Preparing',   color: 'text-orange-400',  bg: 'bg-orange-950/40 border-orange-800/40', Icon: ChefHat },
  READY:       { label: 'Ready',       color: 'text-indigo-400',  bg: 'bg-indigo-950/40 border-indigo-800/40', Icon: Package },
  ON_DELIVERY: { label: 'On Delivery', color: 'text-purple-400',  bg: 'bg-purple-950/40 border-purple-800/40', Icon: Truck },
  DELIVERED:   { label: 'Delivered',   color: 'text-green-400',   bg: 'bg-green-950/40 border-green-800/40',   Icon: CheckCircle2 },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400',     bg: 'bg-red-950/40 border-red-800/40',       Icon: XCircle },
};

function StatusBadge({ status }: { status: OrderStatusType }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const { label, color, bg, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: orders = [], refetch } = useOrdersQuery();
  const { data: restaurants = [] } = useRestaurantsQuery();

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-950/40 text-red-500 rounded-full border border-red-900/40 shadow-inner">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{user?.email.split('@')[0]}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="bg-slate-855 text-slate-300 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider">
            Role: {user?.role}
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs text-slate-300 hover:text-white transition-all px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl font-bold cursor-pointer"
          >
            Refresh Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Stats/Summary */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" /> Total Orders
                </span>
                <span className="text-white font-bold text-lg">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" /> Active Orders
                </span>
                <span className="text-amber-500 font-bold text-lg">{activeOrders.length}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500" /> Total Invested
                </span>
                <span className="text-red-500 font-black text-lg">
                  ${orders.reduce((acc, curr) => acc + (curr.status !== 'CANCELLED' ? curr.total_price : 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Order history */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Orders Section */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-red-650 rounded-full" />
              Active Orders ({activeOrders.length})
            </h2>
            {activeOrders.length === 0 ? (
              <p className="text-slate-500 text-sm italic bg-slate-900/20 border border-slate-800 rounded-2xl p-6">
                No active orders at the moment.
              </p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const rest = restaurants.find(r => r.id === order.restaurant_id);
                  return (
                    <Card key={order.id} className="border-red-950/40 hover:border-red-900/30">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-extrabold text-white text-base">
                            {rest?.name || 'Restaurant'}
                          </h4>
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-300">
                                <span className="text-slate-500 mr-2">{item.quantity}×</span>
                                {item.name}
                              </span>
                              <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Order Total</span>
                        <span className="text-red-500 font-black text-lg">${order.total_price.toFixed(2)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Orders Section */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-slate-700 rounded-full" />
              Order History ({pastOrders.length})
            </h2>
            {pastOrders.length === 0 ? (
              <p className="text-slate-500 text-sm italic bg-slate-900/20 border border-slate-800 rounded-2xl p-6">
                No past orders found.
              </p>
            ) : (
              <div className="space-y-4">
                {pastOrders.map((order) => {
                  const rest = restaurants.find(r => r.id === order.restaurant_id);
                  return (
                    <Card key={order.id}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-extrabold text-white text-base">
                            {rest?.name || 'Restaurant'}
                          </h4>
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-300">
                                <span className="text-slate-500 mr-2">{item.quantity}×</span>
                                {item.name}
                              </span>
                              <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Order Total</span>
                        <span className="text-red-500 font-black text-lg">${order.total_price.toFixed(2)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
