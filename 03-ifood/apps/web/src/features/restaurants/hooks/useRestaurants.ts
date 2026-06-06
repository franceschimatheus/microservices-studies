import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().transform(val => val || ''),
  address: z.string(),
  created_at: z.string(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

const GATEWAY_URL = 'http://localhost:8085';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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
      const validatedData = z.array(RestaurantSchema).parse(data || []);
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

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    createRestaurant,
  };
}
