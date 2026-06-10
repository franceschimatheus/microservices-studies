import { z } from 'zod';

// API Response Schemas
export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().transform(val => val || ''),
  address: z.string(),
  created_at: z.string(),
});
export type RestaurantType = z.infer<typeof restaurantSchema>;

export const categorySchema = z.object({
  id: z.string(),
  restaurant_id: z.string(),
  name: z.string(),
});
export type CategoryType = z.infer<typeof categorySchema>;

export const menuItemSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().transform(val => val || ''),
  price: z.number(),
  available: z.boolean(),
});
export type MenuItemType = z.infer<typeof menuItemSchema>;

export const restaurantFormSchema = restaurantSchema
  .omit({ id: true, created_at: true })
  .extend({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    description: z.string().optional(),
  });
export type RestaurantFormType = z.infer<typeof restaurantFormSchema>;

export const categoryFormSchema = categorySchema
  .pick({ name: true })
  .extend({
    name: z.string().min(1, 'Category name is required'),
  });
export type CategoryFormType = z.infer<typeof categoryFormSchema>;

export const menuItemFormSchema = menuItemSchema
  .omit({ id: true, category_id: true })
  .extend({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    price: z.number().min(0.01, 'Price must be at least 0.01'),
  });
export type MenuItemFormType = z.infer<typeof menuItemFormSchema>;
