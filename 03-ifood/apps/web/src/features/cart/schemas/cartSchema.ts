import { z } from 'zod';

export const CartItemSchema = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int(),
});

export const CartSchema = z.object({
  user_id: z.string(),
  restaurant_id: z.string().optional().default(''),
  items: z
    .array(CartItemSchema)
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  total_price: z.number(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

export interface AddItemData {
  menu_item_id: string;
  restaurant_id: string;
  name: string;
  price: number;
  quantity: number;
}
