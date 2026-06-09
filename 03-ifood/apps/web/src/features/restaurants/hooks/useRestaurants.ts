import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import {
  RestaurantType,
  restaurantSchema,
  CategoryType,
  categorySchema,
  MenuItemType,
  menuItemSchema,
} from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${GATEWAY_URL}/restaurants`);
      if (!res.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await res.json();
      const validatedData = z.array(restaurantSchema).parse(data || []);
      setRestaurants(validatedData);
    } catch (err: any) {
      setError(err.message || 'Error loading restaurants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRestaurant = async (name: string, description: string, address: string) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, address }),
      });

      if (!res.ok) {
        throw new Error('Failed to create restaurant');
      }

      await fetchRestaurants();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const updateRestaurant = async (id: string, name: string, description: string, address: string) => {
    try {
      const res = await fetch(`${GATEWAY_URL}/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, address }),
      });

      if (!res.ok) {
        throw new Error('Failed to update restaurant');
      }

      await fetchRestaurants();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const deleteRestaurant = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${GATEWAY_URL}/restaurants/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete restaurant');
      }

      await fetchRestaurants();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const fetchCategories = async (restaurantId: string): Promise<CategoryType[]> => {
    const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/categories`);
    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await res.json();
    return z.array(categorySchema).parse(data || []);
  };

  const createCategory = async (restaurantId: string, name: string): Promise<CategoryType> => {
    const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error('Failed to create category');
    }
    const data = await res.json();
    return categorySchema.parse(data);
  };

  const fetchMenu = async (restaurantId: string): Promise<MenuItemType[]> => {
    const res = await fetch(`${GATEWAY_URL}/restaurants/${restaurantId}/menu`);
    if (!res.ok) {
      throw new Error('Failed to fetch menu');
    }
    const data = await res.json();
    return z.array(menuItemSchema).parse(data || []);
  };

  const createMenuItem = async (categoryId: string, name: string, description: string, price: number): Promise<MenuItemType> => {
    const res = await fetch(`${GATEWAY_URL}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category_id: categoryId, name, description, price }),
    });
    if (!res.ok) {
      throw new Error('Failed to create menu item');
    }
    const data = await res.json();
    return menuItemSchema.parse(data);
  };

  const updateMenuItem = async (id: string, name: string, description: string, price: number, available: boolean): Promise<MenuItemType> => {
    const res = await fetch(`${GATEWAY_URL}/menu-items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, price, available }),
    });
    if (!res.ok) {
      throw new Error('Failed to update menu item');
    }
    const data = await res.json();
    return menuItemSchema.parse(data);
  };

  const deleteMenuItem = async (id: string): Promise<void> => {
    const res = await fetch(`${GATEWAY_URL}/menu-items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete menu item');
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    fetchCategories,
    createCategory,
    fetchMenu,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}
