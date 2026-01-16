import { z } from "zod";

import { productSelectSchema } from "@/db/schema/products";
import { shippingMethodSelectSchema } from "@/db/schema/shipping-methods";
import { wcOrderItemSelectSchema } from "@/db/schema/wc-order-items";
import { wcOrderSelectSchema } from "@/db/schema/wc-orders";

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
  // Totales generales
  totalOrders: number;
  totalSales: number; // Ingresos totales (productos + envío cobrado al cliente)

  // Desglose de ingresos
  productSales: number; // Ventas de productos (sin envío)
  shippingSales: number; // Lo que paga el cliente por envío

  // Desglose de costes
  totalProductCost: number; // Coste de los productos
  totalShippingCost: number; // Coste real del envío (lo que pagamos)
  totalPackagingCost: number; // Coste de empaquetado
  totalCosts: number; // Suma de todos los costes

  // Beneficios
  grossProfit: number; // Beneficio bruto = Ventas productos - Coste productos
  netProfit: number; // Beneficio neto = Ventas totales - Todos los costes

  // Márgenes
  grossMargin: number; // % Margen bruto = (Beneficio bruto / Ventas productos) * 100
  netMargin: number; // % Margen neto = (Beneficio neto / Ventas totales) * 100
  productOnlyMargin: number; // % Margen solo producto = ((Precio venta - Coste) / Precio venta) * 100
  fullMargin: number; // % Margen completo = (Beneficio neto / Ventas totales) * 100

  // Métricas adicionales
  averageOrderValue: number; // Ticket medio = Ventas totales / Número pedidos
  averageProductCostPerOrder: number; // Coste medio producto por pedido
  averageShippingCostPerOrder: number; // Coste medio envío por pedido
  shippingCostVsRevenue: number; // % Coste envío sobre ventas envío = (Coste envío / Ventas envío) * 100
  profitPerOrder: number; // Beneficio medio por pedido

  // Alertas
  ordersWithMissingCosts: number;
  productsMissingCosts: number;
  shippingMethodsMissingCosts: number;

  // Período
  periodLabel: string;

  // Legacy (mantener compatibilidad)
  totalProfit: number;
  profitMargin: number;
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
