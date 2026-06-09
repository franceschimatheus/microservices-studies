'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navbar } from '@/features/auth/components/Navbar';
import { useRestaurants } from '@/features/restaurants/hooks/useRestaurants';
import { RestaurantType, CategoryType, MenuItemType } from '@/features/restaurants/schemas';
import Link from 'next/link';
import { RestaurantForm } from './components/RestaurantForm';
import { CategoryForm } from './components/CategoryForm';
import { MenuItemForm } from './components/MenuItemForm';
import { RestaurantFormType, MenuItemFormType } from '@/features/restaurants/schemas';

export default function AdminRestaurantsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const {
    restaurants,
    loading: resLoading,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    fetchCategories,
    createCategory,
    fetchMenu,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useRestaurants();

  // Management State
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantType | null>(null);
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Keep track of which category is showing the add item form
  const [showAddMenuFormForCat, setShowAddMenuFormForCat] = useState<string | null>(null);
  // Keep track of which menu item is being edited
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemType | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'customer') {
        router.push('/customer');
      } else if (user.role === 'admin' && typeof window !== 'undefined' && localStorage.getItem('admin_view_mode') === 'customer') {
        router.push('/customer');
      }
    }
  }, [user, authLoading, router]);

  // Load menu data when selected restaurant changes
  useEffect(() => {
    if (selectedRestaurant) {
      loadMenuData(selectedRestaurant.id);
    }
  }, [selectedRestaurant]);

  const loadMenuData = async (resId: string) => {
    setLoadingMenu(true);
    try {
      const [cats, items] = await Promise.all([
        fetchCategories(resId),
        fetchMenu(resId),
      ]);
      setCategories(cats);
      setMenuItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Submit Restaurant Form
  const onSubmitRestaurant = async (data: RestaurantFormType) => {
    try {
      if (isEditingRestaurant && selectedRestaurant) {
        await updateRestaurant(selectedRestaurant.id, data.name, data.description || '', data.address);
        setSelectedRestaurant({
          ...selectedRestaurant,
          name: data.name,
          description: data.description || '',
          address: data.address,
        });
        setIsEditingRestaurant(false);
      } else {
        await createRestaurant(data.name, data.description || '', data.address);
        setIsAddingRestaurant(false);
      }
    } catch (err) {
      alert('Failed to save restaurant.');
    }
  };

  // Submit Category Form
  const onSubmitCategory = async (data: { name: string }) => {
    if (!selectedRestaurant) return;
    try {
      await createCategory(selectedRestaurant.id, data.name);
      loadMenuData(selectedRestaurant.id);
    } catch (err) {
      alert('Failed to create category.');
    }
  };

  // Submit Menu Item Form
  const onSubmitMenuItem = async (data: MenuItemFormType) => {
    if (!selectedRestaurant) return;
    try {
      if (editingMenuItem) {
        await updateMenuItem(editingMenuItem.id, data.name, data.description, data.price, data.available);
        setEditingMenuItem(null);
      } else if (showAddMenuFormForCat) {
        await createMenuItem(showAddMenuFormForCat, data.name, data.description, data.price);
        setShowAddMenuFormForCat(null);
      }
      loadMenuData(selectedRestaurant.id);
    } catch (err) {
      alert('Failed to save menu item.');
    }
  };

  const startEditRestaurant = (res: RestaurantType) => {
    setIsEditingRestaurant(true);
    setIsAddingRestaurant(false);
    setSelectedRestaurant(res);
  };

  const startAddRestaurant = () => {
    setIsAddingRestaurant(true);
    setIsEditingRestaurant(false);
    setSelectedRestaurant(null);
  };

  const startEditMenuItem = (item: MenuItemType) => {
    setEditingMenuItem(item);
    setShowAddMenuFormForCat(null);
  };

  const toggleItemAvailability = async (item: MenuItemType) => {
    if (!selectedRestaurant) return;
    try {
      await updateMenuItem(item.id, item.name, item.description || '', item.price, !item.available);
      loadMenuData(selectedRestaurant.id);
    } catch (err) {
      alert('Failed to toggle availability.');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      if (selectedRestaurant) {
        loadMenuData(selectedRestaurant.id);
      }
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleDeleteRestaurant = async (resId: string) => {
    if (!confirm('Are you sure you want to delete this restaurant? This will remove it from lists.')) return;
    try {
      await deleteRestaurant(resId);
      if (selectedRestaurant?.id === resId) {
        setSelectedRestaurant(null);
      }
    } catch (err) {
      alert('Failed to delete restaurant.');
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-medium text-sm">Validating session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Navbar email={user.email} role={user.role} onLogout={logout} />

      <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto flex flex-col gap-8">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-6">
          <div>
            <Link 
              href="/admin"
              className="text-indigo-400 hover:text-indigo-350 text-sm font-semibold flex items-center gap-1.5 cursor-pointer mb-2"
            >
              ← Back to Main Console
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Restaurant & Menu Control Center 🍔</h1>
            <p className="text-slate-400 text-sm mt-1">Add, update, and remove restaurants, structure menu categories, and manage individual items.</p>
          </div>
          <button 
            onClick={startAddRestaurant}
            className="bg-indigo-600 border border-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md text-sm cursor-pointer whitespace-nowrap"
          >
            + Add Restaurant
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Restaurants List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-300">All Locations ({restaurants.length})</h2>
            {resLoading && <div className="text-slate-400 py-4 text-center">Loading locations...</div>}
            
            {!resLoading && restaurants.length === 0 && (
              <div className="text-slate-500 text-center py-12 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                No restaurants found. Create one to begin.
              </div>
            )}

            <div className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto pr-2">
              {restaurants.map((res) => {
                const isSelected = selectedRestaurant?.id === res.id;
                return (
                  <div 
                    key={res.id} 
                    onClick={() => { setSelectedRestaurant(res); setIsEditingRestaurant(false); setIsAddingRestaurant(false); }}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-indigo-950/20 border-indigo-500/50 shadow-indigo-950/20' 
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bold text-slate-200 text-base leading-tight">{res.name}</h3>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditRestaurant(res); }}
                            className="text-xs text-indigo-400 hover:text-indigo-350 cursor-pointer font-medium"
                          >
                            Edit
                          </button>
                          <span className="text-slate-750 text-xs">|</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRestaurant(res.id); }}
                            className="text-xs text-rose-500 hover:text-rose-455 cursor-pointer font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{res.description || 'No description provided.'}</p>
                    </div>
                    <div className="text-slate-500 text-[11px] border-t border-slate-850/60 pt-3 flex items-center justify-between">
                      <span>📍 {res.address}</span>
                      {isSelected && <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Active</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Section: Detailed Workspace (Forms, Categories, Menus) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 1. Add / Edit Restaurant Form */}
            {isAddingRestaurant && (
              <RestaurantForm 
                title="Register New Restaurant"
                onSubmit={onSubmitRestaurant}
                onCancel={() => setIsAddingRestaurant(false)}
              />
            )}

            {isEditingRestaurant && selectedRestaurant && (
              <RestaurantForm 
                title={`Edit Restaurant: ${selectedRestaurant.name}`}
                initialData={{
                  name: selectedRestaurant.name,
                  address: selectedRestaurant.address,
                  description: selectedRestaurant.description || '',
                }}
                onSubmit={onSubmitRestaurant}
                onCancel={() => setIsEditingRestaurant(false)}
              />
            )}

            {/* 2. Restaurant Menu Dashboard */}
            {selectedRestaurant && !isEditingRestaurant && !isAddingRestaurant && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Active Restaurant Header & Category Creator */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{selectedRestaurant.name}</h2>
                    <p className="text-slate-400 text-xs mt-1">📍 {selectedRestaurant.address}</p>
                  </div>

                  <CategoryForm onSubmit={onSubmitCategory} />
                </div>

                {loadingMenu && <div className="text-slate-400 py-12 text-center">Loading menu and categories...</div>}

                {!loadingMenu && categories.length === 0 && (
                  <div className="text-slate-500 text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                    No categories registered. Create a category to start building this restaurant's menu.
                  </div>
                )}

                {/* Categories and Menu Items List */}
                {!loadingMenu && categories.length > 0 && (
                  <div className="flex flex-col gap-8">
                    {categories.map((cat) => {
                      const itemsInCat = menuItems.filter(item => item.category_id === cat.id);
                      return (
                        <div key={cat.id} className="bg-slate-900/30 border border-slate-850 rounded-3xl p-6 flex flex-col gap-4">
                          <div className="flex justify-between items-center border-b border-slate-850/60 pb-3">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                              📁 {cat.name} 
                              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                                {itemsInCat.length} items
                              </span>
                            </h3>
                            <button
                              onClick={() => {
                                setEditingMenuItem(null);
                                setShowAddMenuFormForCat(showAddMenuFormForCat === cat.id ? null : cat.id);
                              }}
                              className="text-xs bg-slate-800 hover:bg-indigo-650 hover:text-white text-slate-300 font-bold py-2 px-3 rounded-lg cursor-pointer transition-all"
                            >
                              {showAddMenuFormForCat === cat.id ? 'Cancel' : '+ Add Item'}
                            </button>
                          </div>

                          {/* Add Item form */}
                          {showAddMenuFormForCat === cat.id && (
                            <MenuItemForm 
                              title="New Item details"
                              submitLabel="Create Menu Item"
                              onSubmit={onSubmitMenuItem}
                              onCancel={() => setShowAddMenuFormForCat(null)}
                              isInline
                            />
                          )}

                          {/* Items Display */}
                          {itemsInCat.length === 0 ? (
                            <div className="text-slate-500 text-xs py-2 italic">No items listed.</div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {itemsInCat.map((item) => {
                                const isEditing = editingMenuItem?.id === item.id;
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`bg-slate-950/60 border rounded-2xl p-5 flex flex-col justify-between transition-all ${isEditing ? 'border-indigo-500' : 'border-slate-850'}`}
                                  >
                                    {isEditing ? (
                                      <MenuItemForm 
                                        title="Edit Menu Item"
                                        submitLabel="Save Changes"
                                        initialData={{
                                          name: item.name,
                                          description: item.description || '',
                                          price: item.price,
                                          available: item.available,
                                        }}
                                        onSubmit={onSubmitMenuItem}
                                        onCancel={() => setEditingMenuItem(null)}
                                      />
                                    ) : (
                                      <>
                                        <div>
                                          <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className="font-bold text-slate-100 text-sm">{item.name}</h4>
                                            <span className="text-sm font-extrabold text-indigo-400 shrink-0">
                                              ${item.price.toFixed(2)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 h-8 mb-4">
                                            {item.description || 'No description provided.'}
                                          </p>
                                        </div>

                                        <div className="flex justify-between items-center border-t border-slate-850/40 pt-3 mt-1">
                                          <button
                                            onClick={() => toggleItemAvailability(item)}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                                              item.available 
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400' 
                                                : 'bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                                            }`}
                                            title="Click to toggle availability status"
                                          >
                                            {item.available ? '● Available' : '○ Unavailable'}
                                          </button>

                                          <div className="flex gap-2.5">
                                            <button 
                                              onClick={() => startEditMenuItem(item)}
                                              className="text-xs text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                            <span className="text-slate-800">|</span>
                                            <button 
                                              onClick={() => handleDeleteMenuItem(item.id)}
                                              className="text-xs text-rose-500 hover:text-rose-455 transition-all cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedRestaurant && !isAddingRestaurant && !isEditingRestaurant && (
              <div className="bg-slate-900/20 border border-slate-850 border-dashed rounded-3xl py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🍕</span>
                <span className="font-semibold text-sm">Select a restaurant location from the left to manage its categories and menu items.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
