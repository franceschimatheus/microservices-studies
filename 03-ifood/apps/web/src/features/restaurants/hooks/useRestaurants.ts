import { useQueryClient } from '@tanstack/react-query';
import { useRestaurantsQuery } from '../queries/useRestaurantsQuery';
import { useCreateRestaurantMutation } from '../queries/useCreateRestaurantMutation';
import { useUpdateRestaurantMutation } from '../queries/useUpdateRestaurantMutation';
import { useDeleteRestaurantMutation } from '../queries/useDeleteRestaurantMutation';


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


  return {
    restaurants,
    loading,
    error: error ? (error as Error).message : null,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
  };
}
