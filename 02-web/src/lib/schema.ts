import * as z from "zod";

export const orderSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  userEmail: z.email("Invalid email address"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
