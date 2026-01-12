import { and, count, desc, eq, gte, isNull, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { products, profitabilitySettings, shippingMethods, wcOrderItems, wcOrders } from "@/db/schema";
import { DashboardStats, DateRange, DEFAULT_PACKAGING_COST, OrderSummary, SETTINGS_KEYS } from "../types";

export async function getPackagingCost(): Promise<number> {
  const [setting] = await db
    .select()
    .from(profitabilitySettings)
    .where(eq(profitabilitySettings.key, SETTINGS_KEYS.PACKAGING_COST))
    .limit(1);

  return parseFloat(setting?.value || DEFAULT_PACKAGING_COST);
}

export async function setPackagingCost(cost: number): Promise<void> {
  const [existing] = await db
    .select()
    .from(profitabilitySettings)
    .where(eq(profitabilitySettings.key, SETTINGS_KEYS.PACKAGING_COST))
    .limit(1);

  if (existing) {
    await db
      .update(profitabilitySettings)
      .set({ value: cost.toString(), updatedAt: new Date() })
      .where(eq(profitabilitySettings.key, SETTINGS_KEYS.PACKAGING_COST));
  } else {
    await db.insert(profitabilitySettings).values({
      key: SETTINGS_KEYS.PACKAGING_COST,
      value: cost.toString(),
      description: "Coste de empaquetado por pedido (€)",
    });
  }
}

export async function getDashboardStats(dateRange?: DateRange): Promise<DashboardStats> {
  const packagingCost = await getPackagingCost();

  // Construir condiciones de fecha
  const dateConditions = dateRange
    ? and(
        gte(wcOrders.orderDate, dateRange.from),
        lte(wcOrders.orderDate, dateRange.to)
      )
    : undefined;

  // Obtener totales de pedidos
  const ordersQuery = db
    .select({
      totalOrders: count(),
      totalSales: sum(wcOrders.total),
      totalShippingSales: sum(wcOrders.shippingTotal),
    })
    .from(wcOrders)
    .where(dateConditions);

  const [ordersResult] = await ordersQuery;

  // Obtener costes de productos
  const productCostsQuery = db
    .select({
      totalProductCost: sum(wcOrderItems.totalCost),
    })
    .from(wcOrderItems)
    .innerJoin(wcOrders, eq(wcOrderItems.orderId, wcOrders.id))
    .where(dateConditions);

  const [productCostsResult] = await productCostsQuery;

  // Obtener costes de envío
  const shippingCostsQuery = db
    .select({
      totalShippingCost: sql<string>`
        COALESCE(SUM(${shippingMethods.cost}), 0)
      `,
    })
    .from(wcOrders)
    .leftJoin(shippingMethods, eq(wcOrders.shippingMethodId, shippingMethods.id))
    .where(dateConditions);

  const [shippingCostsResult] = await shippingCostsQuery;

  // Contar pedidos con items sin coste
  const ordersWithMissingCostsQuery = db
    .select({
      count: sql<number>`COUNT(DISTINCT ${wcOrders.id})`,
    })
    .from(wcOrders)
    .innerJoin(wcOrderItems, eq(wcOrderItems.orderId, wcOrders.id))
    .where(and(dateConditions, isNull(wcOrderItems.unitCost)));

  const [ordersWithMissingCosts] = await ordersWithMissingCostsQuery;

  // Contar productos sin coste
  const [productsMissingCosts] = await db
    .select({ count: count() })
    .from(products)
    .where(isNull(products.currentCost));

  // Contar métodos de envío sin coste
  const [shippingMissingCosts] = await db
    .select({ count: count() })
    .from(shippingMethods)
    .where(and(eq(shippingMethods.isActive, true), isNull(shippingMethods.cost)));

  // Calcular totales
  const totalOrders = ordersResult.totalOrders || 0;
  const totalSales = parseFloat(ordersResult.totalSales || "0");
  const totalProductCost = parseFloat(productCostsResult.totalProductCost || "0");
  const totalShippingCost = parseFloat(shippingCostsResult.totalShippingCost || "0");
  const totalPackagingCost = totalOrders * packagingCost;
  const totalCosts = totalProductCost + totalShippingCost + totalPackagingCost;
  const totalProfit = totalSales - totalCosts;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  // Etiqueta del período
  let periodLabel = "Todo el tiempo";
  if (dateRange) {
    const fromStr = dateRange.from.toLocaleDateString("es-ES");
    const toStr = dateRange.to.toLocaleDateString("es-ES");
    periodLabel = `${fromStr} - ${toStr}`;
  }

  return {
    totalOrders,
    totalSales,
    totalCosts,
    totalProfit,
    profitMargin,
    ordersWithMissingCosts: ordersWithMissingCosts.count || 0,
    productsMissingCosts: productsMissingCosts.count || 0,
    shippingMethodsMissingCosts: shippingMissingCosts.count || 0,
    periodLabel,
  };
}

export async function getOrdersSummary(
  dateRange?: DateRange,
  page = 1,
  pageSize = 20
): Promise<{ orders: OrderSummary[]; total: number }> {
  const packagingCost = await getPackagingCost();
  const offset = (page - 1) * pageSize;

  // Construir condiciones de fecha
  const dateConditions = dateRange
    ? and(
        gte(wcOrders.orderDate, dateRange.from),
        lte(wcOrders.orderDate, dateRange.to)
      )
    : undefined;

  // Contar total
  const [totalResult] = await db
    .select({ count: count() })
    .from(wcOrders)
    .where(dateConditions);

  // Obtener pedidos con sus items y costes
  const ordersData = await db
    .select({
      id: wcOrders.id,
      wcOrderId: wcOrders.wcOrderId,
      orderNumber: wcOrders.orderNumber,
      status: wcOrders.status,
      orderDate: wcOrders.orderDate,
      customerName: wcOrders.customerName,
      total: wcOrders.total,
      shippingTotal: wcOrders.shippingTotal,
      shippingMethodId: wcOrders.shippingMethodId,
      shippingCost: shippingMethods.cost,
    })
    .from(wcOrders)
    .leftJoin(shippingMethods, eq(wcOrders.shippingMethodId, shippingMethods.id))
    .where(dateConditions)
    .orderBy(desc(wcOrders.orderDate))
    .limit(pageSize)
    .offset(offset);

  // Para cada pedido, obtener costes de items
  const orders: OrderSummary[] = await Promise.all(
    ordersData.map(async (order) => {
      // Obtener items del pedido
      const items = await db
        .select({
          unitCost: wcOrderItems.unitCost,
          totalCost: wcOrderItems.totalCost,
        })
        .from(wcOrderItems)
        .where(eq(wcOrderItems.orderId, order.id));

      // Calcular coste de productos
      const hasItemsWithoutCost = items.some((item) => item.unitCost === null);
      const productsCost = hasItemsWithoutCost
        ? null
        : items.reduce((sum, item) => sum + parseFloat(item.totalCost || "0"), 0);

      // Coste de envío
      const shippingCost = order.shippingCost ? parseFloat(order.shippingCost) : null;
      const hasShippingWithoutCost = order.shippingMethodId !== null && shippingCost === null;

      // Calcular total de costes
      let totalCost: number | null = null;
      if (productsCost !== null && (shippingCost !== null || order.shippingMethodId === null)) {
        totalCost = productsCost + (shippingCost || 0) + packagingCost;
      }

      // Calcular beneficio
      const totalSale = parseFloat(order.total);
      const profit = totalCost !== null ? totalSale - totalCost : null;
      const profitMargin = profit !== null && totalSale > 0 ? (profit / totalSale) * 100 : null;

      return {
        id: order.id,
        wcOrderId: order.wcOrderId,
        orderNumber: order.orderNumber,
        status: order.status,
        orderDate: order.orderDate,
        customerName: order.customerName,
        totalSale,
        shippingSale: parseFloat(order.shippingTotal),
        productsCost,
        shippingCost,
        packagingCost,
        totalCost,
        profit,
        profitMargin,
        hasItemsWithoutCost,
        hasShippingWithoutCost,
      };
    })
  );

  return { orders, total: totalResult.count };
}
