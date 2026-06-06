'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import { Store, Plus, MapPin, Utensils, X } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  created_at: string;
}

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setRestaurantsLoading(true);
      const res = await fetch('http://localhost:8085/restaurants');
      if (!res.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await res.json();
      setRestaurants(data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading restaurants.');
    } finally {
      setRestaurantsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin' && typeof window !== 'undefined' && localStorage.getItem('admin_view_mode') !== 'customer') {
        router.push('/admin');
      } else {
        fetchRestaurants();
      }
    }
  }, [user, loading, router]);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    try {
      setSubmitting(true);
      const res = await fetch('http://localhost:8085/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, address }),
      });

      if (!res.ok) {
        throw new Error('Failed to create restaurant');
      }

      setName('');
      setDescription('');
      setAddress('');
      setIsModalOpen(false);
      fetchRestaurants();
    } catch (err: any) {
      alert(err.message || 'Error creating restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const switchToAdminView = () => {
    localStorage.removeItem('admin_view_mode');
    router.push('/admin');
  };

  const isAdminViewingAsCustomer = user?.role === 'admin' && typeof window !== 'undefined' && localStorage.getItem('admin_view_mode') === 'customer';

  if (loading || !user || (user.role !== 'customer' && !isAdminViewingAsCustomer)) {
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

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
            onClick={() => setIsModalOpen(true)}
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
                    <div className="h-6 bg-slate-800 rounded-lg w-2/3"></div>
                    <div className="h-4 bg-slate-800 rounded-lg w-full"></div>
                    <div className="h-4 bg-slate-800 rounded-lg w-4/5"></div>
                  </div>
                  <div className="h-4 bg-slate-800 rounded-lg w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 text-red-400 text-center">
              {error}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
              <Store className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold mb-2">No restaurants available</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Be the first to register a new restaurant in our platform to browse their menus.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
              >
                Register a Restaurant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <div 
                  key={restaurant.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-red-950/30 text-red-500 rounded-2xl border border-red-900/30">
                        <Store className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold truncate">{restaurant.name}</h3>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 min-h-[60px] leading-relaxed">
                      {restaurant.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs border-t border-slate-850 pt-4 mt-2">
                    <MapPin className="w-4 h-4 shrink-0 text-red-500/70" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal/Dialog for Restaurant Creation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Store className="text-red-500 w-6 h-6" />
              Register New Restaurant
            </h3>

            <form onSubmit={handleCreateRestaurant} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">Restaurant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bella Italia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">Description</label>
                <textarea
                  placeholder="Delicious authentic pizzas and pasta..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-semibold mb-2">Address</label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, Foodtown"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl px-4 py-3 text-white placeholder-slate-650 focus:outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
