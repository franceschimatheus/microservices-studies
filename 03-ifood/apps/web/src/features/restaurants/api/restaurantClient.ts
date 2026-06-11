import { _get, _post, _put, _delete } from '@/services/api';
import {
  restaurantSchema,
  RestaurantType,
  RestaurantFormType,
  categorySchema,
  CategoryType,
  CategoryFormType,
  menuItemSchema,
  MenuItemType,
  MenuItemFormType,
} from '../schemas';
import { z } from 'zod';

export const restaurantClient = {
  getRestaurants: async (): Promise<RestaurantType[]> => {
    const res = await _get('/restaurants');
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    const data = await res.json();
    return z.array(restaurantSchema).parse(data || []);
  },

  createRestaurant: async (data: RestaurantFormType): Promise<RestaurantType> => {
    const res = await _post('/restaurants', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create restaurant');
    }
    const result = await res.json();
    return restaurantSchema.parse(result);
  },

  updateRestaurant: async (id: string, data: RestaurantFormType): Promise<RestaurantType> => {
    const res = await _put(`/restaurants/${id}`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update restaurant');
    }
    const result = await res.json();
    return restaurantSchema.parse(result);
  },

  deleteRestaurant: async (id: string): Promise<void> => {
    const res = await _delete(`/restaurants/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete restaurant');
    }
  },

  getCategories: async (restaurantId: string): Promise<CategoryType[]> => {
    const res = await _get(`/restaurants/${restaurantId}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return z.array(categorySchema).parse(data || []);
  },

  createCategory: async (restaurantId: string, data: CategoryFormType): Promise<CategoryType> => {
    const res = await _post(`/restaurants/${restaurantId}/categories`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create category');
    }
    const result = await res.json();
    return categorySchema.parse(result);
  },

  getMenu: async (restaurantId: string): Promise<MenuItemType[]> => {
    const res = await _get(`/restaurants/${restaurantId}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu items');
    const data = await res.json();
    return z.array(menuItemSchema).parse(data || []);
  },

  createMenuItem: async (data: MenuItemFormType & { category_id: string }): Promise<MenuItemType> => {
    const res = await _post('/menu-items', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create menu item');
    }
    const result = await res.json();
    return menuItemSchema.parse(result);
  },

  updateMenuItem: async (id: string, data: MenuItemFormType & { category_id: string }): Promise<MenuItemType> => {
    const res = await _put(`/menu-items/${id}`, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update menu item');
    }
    const result = await res.json();
    return menuItemSchema.parse(result);
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    const res = await _delete(`/menu-items/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete menu item');
    }
  },
};
