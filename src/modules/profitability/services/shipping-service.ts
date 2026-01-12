import { asc, count, desc, eq, isNull, and, sql } from "drizzle-orm";

import { db } from "@/db";
import { shippingMethods, wcOrders } from "@/db/schema";
import { ShippingMethod } from "../types";

export type ShippingMethodWithStats = ShippingMethod & {
  ordersCount: number;
  totalRevenue: number;
  totalCost: number | null;
};

export async function getShippingMethods(): Promise<ShippingMethodWithStats[]> {
  const methods = await db
    .select({
      id: shippingMethods.id,
      wcMethodId: shippingMethods.wcMethodId,
      name: shippingMethods.name,
      provider: shippingMethods.provider,
      cost: shippingMethods.cost,
      isActive: shippingMethods.isActive,
      createdAt: shippingMethods.createdAt,
      updatedAt: shippingMethods.updatedAt,
      ordersCount: sql<number>`COUNT(${wcOrders.id})`.as("orders_count"),
      totalRevenue: sql<number>`COALESCE(SUM(${wcOrders.shippingTotal}::numeric), 0)`.as("total_revenue"),
    })
    .from(shippingMethods)
    .leftJoin(wcOrders, eq(wcOrders.shippingMethodId, shippingMethods.id))
    .groupBy(shippingMethods.id)
    .orderBy(desc(sql`orders_count`));

  return methods.map((m) => ({
    ...m,
    ordersCount: Number(m.ordersCount),
    totalRevenue: Number(m.totalRevenue),
    totalCost:
      m.cost !== null ? Number(m.cost) * Number(m.ordersCount) : null,
  }));
}

export async function getShippingMethod(id: number): Promise<ShippingMethod | null> {
  const [method] = await db
    .select()
    .from(shippingMethods)
    .where(eq(shippingMethods.id, id))
    .limit(1);

  return method || null;
}

export async function updateShippingMethodCost(
  id: number,
  cost: number | null
): Promise<ShippingMethod> {
  const [updated] = await db
    .update(shippingMethods)
    .set({
      cost: cost?.toString() || null,
      updatedAt: new Date(),
    })
    .where(eq(shippingMethods.id, id))
    .returning();

  return updated;
}

export async function updateShippingMethod(
  id: number,
  data: Partial<Pick<ShippingMethod, "name" | "provider" | "cost" | "isActive">>
): Promise<ShippingMethod> {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.cost !== undefined) updateData.cost = data.cost?.toString() || null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(shippingMethods)
    .set(updateData)
    .where(eq(shippingMethods.id, id))
    .returning();

  return updated;
}

export async function getShippingMethodsWithoutCost(): Promise<ShippingMethod[]> {
  return db
    .select()
    .from(shippingMethods)
    .where(and(eq(shippingMethods.isActive, true), isNull(shippingMethods.cost)))
    .orderBy(asc(shippingMethods.name));
}

export async function countShippingMethodsWithoutCost(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(shippingMethods)
    .where(and(eq(shippingMethods.isActive, true), isNull(shippingMethods.cost)));

  return result.count;
}
