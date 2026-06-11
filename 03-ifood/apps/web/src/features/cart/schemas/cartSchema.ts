import { z } from 'zod';

export const cartItemSchema = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int(),
});

export const cartSchema = z.object({
  user_id: z.string(),
  restaurant_id: z.string().optional().default(''),
  items: z
    .array(cartItemSchema)
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  total_price: z.number(),
});

export type CartItemType = z.infer<typeof cartItemSchema>;
export type CartType = z.infer<typeof cartSchema>;

export const addItemSchema = z.object({
  menu_item_id: z.string(),
  restaurant_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export type AddItemType = z.infer<typeof addItemSchema>;
