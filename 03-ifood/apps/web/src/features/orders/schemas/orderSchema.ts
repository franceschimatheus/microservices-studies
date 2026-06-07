import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'ON_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const OrderItemSchema = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int(),
});

export const OrderSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  restaurant_id: z.string(),
  total_price: z.number(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema).nullable().optional().transform((v) => v ?? []),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OrderListSchema = z.array(OrderSchema);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
