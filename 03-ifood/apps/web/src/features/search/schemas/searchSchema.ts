import { z } from 'zod';
import { menuItemSchema, restaurantSchema } from '@/features/restaurants/schemas';

export const searchMenuItemSchema = menuItemSchema.extend({
  restaurant_id: z.string(),
});

export type SearchMenuItemType = z.infer<typeof searchMenuItemSchema>;

export const searchRestaurantSchema = restaurantSchema.omit({ created_at: true });

export type SearchRestaurantType = z.infer<typeof searchRestaurantSchema>;

export const searchResultsSchema = z.object({
  restaurants: z.array(searchRestaurantSchema),
  menu_items: z.array(searchMenuItemSchema),
});

export type SearchResultsType = z.infer<typeof searchResultsSchema>;
