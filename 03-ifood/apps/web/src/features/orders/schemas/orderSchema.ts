import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'ON_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);

export const orderItemSchema = z.object({
  menu_item_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int(),
});

export const orderSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  restaurant_id: z.string(),
  total_price: z.number(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema).nullable().optional().transform((v) => v ?? []),
  created_at: z.string(),
  updated_at: z.string(),
});

export const orderListSchema = z.array(orderSchema);

export type OrderStatusType = z.infer<typeof orderStatusSchema>;
export type OrderItemType = z.infer<typeof orderItemSchema>;
export type OrderType = z.infer<typeof orderSchema>;
