import { z } from 'zod';
import { menuItemSchema, restaurantSchema } from '@/features/restaurants/schemas';

export const searchMenuItemSchema = menuItemSchema.extend({
  restaurant_id: z.string(),
});

export type SearchMenuItemType = z.infer<typeof searchMenuItemSchema>;

export const searchResultsSchema = z.object({
  restaurants: z.array(restaurantSchema),
  menu_items: z.array(searchMenuItemSchema),
});

export type SearchResultsData = z.infer<typeof searchResultsSchema>;
