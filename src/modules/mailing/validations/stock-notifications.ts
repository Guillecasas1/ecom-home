import { z } from "zod";

export const stockNotificationsSchema = z.object({
  productId: z.string().min(1, "El ID del producto es requerido"),
  productName: z.string().min(1, "El nombre del producto es requerido"),
  productSku: z.string().min(1, "El SKU del producto es requerido"),
  variant: z.string().optional(),
  email: z.string().email("Introduce un email válido"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().optional(),
});

export type StockNotificationsForm = z.infer<typeof stockNotificationsSchema>;