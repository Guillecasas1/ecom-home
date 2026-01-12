import { z } from "zod";

import { productSelectSchema } from "@/db/schema/products";
import { shippingMethodSelectSchema } from "@/db/schema/shipping-methods";
import { wcOrderSelectSchema } from "@/db/schema/wc-orders";
import { wcOrderItemSelectSchema } from "@/db/schema/wc-order-items";

export type Product = z.infer<typeof productSelectSchema>;
export type ShippingMethod = z.infer<typeof shippingMethodSelectSchema>;
export type WcOrder = z.infer<typeof wcOrderSelectSchema>;
export type WcOrderItem = z.infer<typeof wcOrderItemSelectSchema>;

export type OrderWithItems = WcOrder & {
  items: (WcOrderItem & {
    product: Product | null;
  })[];
  shippingMethod: ShippingMethod | null;
};

export type OrderSummary = {
  id: number;
  wcOrderId: number;
  orderNumber: string;
  status: string;
  orderDate: Date;
  customerName: string | null;
  // Ventas
  totalSale: number;
  shippingSale: number;
  // Costes
  productsCost: number | null;
  shippingCost: number | null;
  packagingCost: number;
  totalCost: number | null;
  // Beneficio
  profit: number | null;
  profitMargin: number | null;
  // Alertas
  hasItemsWithoutCost: boolean;
  hasShippingWithoutCost: boolean;
};

export type DashboardStats = {
  totalOrders: number;
  totalSales: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
  ordersWithMissingCosts: number;
  productsMissingCosts: number;
  shippingMethodsMissingCosts: number;
  // Por período
  periodLabel: string;
};

export type ProductWithStats = Product & {
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number | null;
  totalProfit: number | null;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export const SETTINGS_KEYS = {
  PACKAGING_COST: "packaging_cost",
} as const;

export const DEFAULT_PACKAGING_COST = "0.90";
