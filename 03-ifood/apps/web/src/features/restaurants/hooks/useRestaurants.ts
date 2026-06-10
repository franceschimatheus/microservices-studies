import { useQueryClient } from '@tanstack/react-query';
import { useRestaurantsQuery } from '../queries/useRestaurantsQuery';
import { useCreateRestaurantMutation } from '../queries/useCreateRestaurantMutation';
import { useUpdateRestaurantMutation } from '../queries/useUpdateRestaurantMutation';
import { useDeleteRestaurantMutation } from '../queries/useDeleteRestaurantMutation';
import { z } from 'zod';
import {
  CategoryType,
  categorySchema,
  MenuItemType,
  menuItemSchema,
} from '../schemas';

const GATEWAY_URL = 'http://localhost:8085';

export function useRestaurants() {
  const queryClient = useQueryClient();

  // Queries
  const { data: restaurants = [], isLoading: loading, error } = useRestaurantsQuery();

  // Mutations
  const createMutation = useCreateRestaurantMutation();
  const updateMutation = useUpdateRestaurantMutation();
  const deleteMutation = useDeleteRestaurantMutation();

  const fetchRestaurants = async () => {
    await queryClient.invalidateQueries({ queryKey: ['restaurants'] });
  };

  const createRestaurant = async (name: string, description: string, address: string) => {
    await createMutation.mutateAsync({ name, description, address });
  };

  const updateRestaurant = async (id: string, name: string, description: string, address: string) => {
    await updateMutation.mutateAsync({ id, data: { name, description, address } });
  };

  const deleteRestaurant = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
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
    queryClient.invalidateQueries({ queryKey: ['restaurants', restaurantId, 'categories'] });
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

  return {
    restaurants,
    loading,
    error: error ? (error as Error).message : null,
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
