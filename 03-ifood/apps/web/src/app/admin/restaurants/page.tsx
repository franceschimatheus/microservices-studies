'use client';

import React, { useEffect, useState } from 'react';

import { useRestaurants } from '@/features/restaurants/hooks/useRestaurants';
import { RestaurantType, MenuItemType } from '@/features/restaurants/schemas';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { RestaurantForm } from './components/RestaurantForm';
import { CategoryForm } from './components/CategoryForm';
import { MenuItemForm } from './components/MenuItemForm';
import { RestaurantFormType, MenuItemFormType } from '@/features/restaurants/schemas';
import { useCategoriesQuery } from '@/features/restaurants/queries/useCategoriesQuery';
import { useMenuQuery } from '@/features/restaurants/queries/useMenuQuery';
import { useCreateCategoryMutation } from '@/features/restaurants/queries/useCreateCategoryMutation';
import { useCreateMenuItemMutation } from '@/features/restaurants/queries/useCreateMenuItemMutation';
import { useUpdateMenuItemMutation } from '@/features/restaurants/queries/useUpdateMenuItemMutation';
import { useDeleteMenuItemMutation } from '@/features/restaurants/queries/useDeleteMenuItemMutation';

export default function AdminRestaurantsPage() {
  const { toast } = useToast();
  const {
    restaurants,
    loading: resLoading,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
  } = useRestaurants();

  // Management State
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantType | null>(null);
  const [isEditingRestaurant, setIsEditingRestaurant] = useState(false);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);

  const selectedRestaurantId = selectedRestaurant?.id || null;

  // Server State via TanStack Query
  const { data: categories = [] } = useCategoriesQuery(selectedRestaurantId);
  const { data: menuItems = [], isLoading: loadingMenu } = useMenuQuery(selectedRestaurantId);

  const { mutateAsync: createCategoryMutation } = useCreateCategoryMutation(selectedRestaurantId || '');
  const { mutateAsync: createMenuItemMutation } = useCreateMenuItemMutation(selectedRestaurantId || '');
  const { mutateAsync: updateMenuItemMutation } = useUpdateMenuItemMutation(selectedRestaurantId || '');
  const { mutateAsync: deleteMenuItemMutation } = useDeleteMenuItemMutation(selectedRestaurantId || '');

  // Keep track of which category is showing the add item form
  const [showAddMenuFormForCat, setShowAddMenuFormForCat] = useState<string | null>(null);
  // Keep track of which menu item is being edited
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemType | null>(null);

  // Confirm modal state for delete actions
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'restaurant' | 'menuItem';
    id: string;
    name: string;
  } | null>(null);



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
    } catch {
      toast('Failed to save restaurant.', 'error', 'Error');
    }
  };

  // Submit Category Form
  const onSubmitCategory = async (data: { name: string }) => {
    if (!selectedRestaurant) return;
    try {
      await createCategoryMutation(data);
    } catch {
      toast('Failed to create category.', 'error', 'Error');
    }
  };

  // Submit Menu Item Form
  const onSubmitMenuItem = async (data: MenuItemFormType) => {
    if (!selectedRestaurant) return;
    try {
      if (editingMenuItem) {
        await updateMenuItemMutation({ id: editingMenuItem.id, data: { ...data, category_id: editingMenuItem.category_id } });
        setEditingMenuItem(null);
      } else if (showAddMenuFormForCat) {
        await createMenuItemMutation({ ...data, category_id: showAddMenuFormForCat });
        setShowAddMenuFormForCat(null);
      }
    } catch {
      toast('Failed to save menu item.', 'error', 'Error');
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
      await updateMenuItemMutation({ id: item.id, data: { name: item.name, description: item.description || '', price: item.price, available: !item.available, category_id: item.category_id } });
    } catch {
      toast('Failed to toggle availability.', 'error', 'Error');
    }
  };

  const handleDeleteMenuItem = (itemId: string, itemName: string) => {
    setDeleteConfirm({ type: 'menuItem', id: itemId, name: itemName });
  };

  const handleDeleteRestaurant = (resId: string, resName: string) => {
    setDeleteConfirm({ type: 'restaurant', id: resId, name: resName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'menuItem') {
        await deleteMenuItemMutation(deleteConfirm.id);
      } else {
        await deleteRestaurant(deleteConfirm.id);
        if (selectedRestaurant?.id === deleteConfirm.id) {
          setSelectedRestaurant(null);
        }
      }
    } catch {
      toast(
        `Failed to delete ${deleteConfirm.type === 'menuItem' ? 'item' : 'restaurant'}.`,
        'error',
        'Delete Failed'
      );
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Restaurant & Menu Control Center 🍔</h1>
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
              <div className="text-slate-500 text-center py-12 border border-dashed border-slate-900/80 rounded-3xl bg-slate-900/10">
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
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${isSelected
                        ? 'bg-indigo-950/20 border-indigo-900/60 shadow-indigo-950/20'
                        : 'bg-slate-900/40 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/60'
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
                            onClick={(e) => { e.stopPropagation(); handleDeleteRestaurant(res.id, res.name); }}
                            className="text-xs text-rose-500 hover:text-rose-455 cursor-pointer font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{res.description || 'No description provided.'}</p>
                    </div>
                    <div className="text-slate-500 text-[11px] border-t border-slate-900/40 pt-3 flex items-center justify-between">
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
                <div className="bg-slate-900 border border-slate-900/80 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{selectedRestaurant.name}</h2>
                    <p className="text-slate-400 text-xs mt-1">📍 {selectedRestaurant.address}</p>
                  </div>

                  <CategoryForm onSubmit={onSubmitCategory} />
                </div>

                {loadingMenu && <div className="text-slate-400 py-12 text-center">Loading menu and categories...</div>}

                {!loadingMenu && categories.length === 0 && (
                  <div className="text-slate-500 text-center py-20 border border-dashed border-slate-900/80 rounded-3xl bg-slate-900/10">
                    No categories registered. Create a category to start building this restaurant&apos;s menu.
                  </div>
                )}

                {/* Categories and Menu Items List */}
                {!loadingMenu && categories.length > 0 && (
                  <div className="flex flex-col gap-8">
                    {categories.map((cat) => {
                      const itemsInCat = menuItems.filter(item => item.category_id === cat.id);
                      return (
                        <div key={cat.id} className="bg-slate-900/30 border border-slate-900/80 rounded-3xl p-6 flex flex-col gap-4">
                          <div className="flex justify-between items-center border-b border-slate-900/40 pb-3">
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
                                    className={`bg-slate-950/60 border rounded-2xl p-5 flex flex-col justify-between transition-all ${isEditing ? 'border-indigo-900/60' : 'border-slate-900/80'}`}
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

                                        <div className="flex justify-between items-center border-t border-slate-900/25 pt-3 mt-1">
                                          <button
                                            onClick={() => toggleItemAvailability(item)}
                                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${item.available
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
                                              onClick={() => handleDeleteMenuItem(item.id, item.name)}
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
              <div className="bg-slate-900/20 border border-slate-900/80 border-dashed rounded-3xl py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🍕</span>
                <span className="font-semibold text-sm">Select a restaurant location from the left to manage its categories and menu items.</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirm Modal */}
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title={deleteConfirm?.type === 'restaurant' ? 'Delete Restaurant?' : 'Delete Menu Item?'}
          message={
            deleteConfirm?.type === 'restaurant'
              ? `Are you sure you want to delete "${deleteConfirm?.name}"? This will remove it from all listings.`
              : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
        />
    </div>
  );
}
