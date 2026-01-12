"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getDashboardStats,
  getOrdersSummary,
  getPackagingCost,
  setPackagingCost,
} from "../services/dashboard-service";
import {
  bulkUpdateProductCosts,
  getProduct,
  getProducts,
  getProductsWithoutCost,
  ProductsFilter,
  updateProductCost,
} from "../services/products-service";
import {
  getShippingMethod,
  getShippingMethods,
  getShippingMethodsWithoutCost,
  updateShippingMethod,
  updateShippingMethodCost,
} from "../services/shipping-service";
import { DateRange } from "../types";

// ============ Dashboard Actions ============

export async function fetchDashboardStats (dateRange?: DateRange) {
  return getDashboardStats(dateRange);
}

export async function fetchOrdersSummary (
  dateRange?: DateRange,
  page = 1,
  pageSize = 20
) {
  return getOrdersSummary(dateRange, page, pageSize);
}

export async function fetchPackagingCost () {
  return getPackagingCost();
}

export async function updatePackagingCostAction (cost: number) {
  const schema = z.number().min(0).max(1000);
  const validatedCost = schema.parse(cost);

  await setPackagingCost(validatedCost);
  revalidatePath("/admin/profitability");

  return { success: true, cost: validatedCost };
}

// ============ Products Actions ============

export async function fetchProducts (filter?: ProductsFilter) {
  return getProducts(filter);
}

export async function fetchProduct (id: number) {
  return getProduct(id);
}

export async function fetchProductsWithoutCost () {
  return getProductsWithoutCost();
}

export async function updateProductCostAction (id: number, cost: number | null) {
  const idSchema = z.number().int().positive();
  const costSchema = z.number().min(0).max(100000).nullable();

  const validatedId = idSchema.parse(id);
  const validatedCost = costSchema.parse(cost);

  const updated = await updateProductCost(validatedId, validatedCost);
  revalidatePath("/admin/profitability");

  return { success: true, product: updated };
}

export async function bulkUpdateProductCostsAction (
  updates: { id: number; cost: number | null }[]
) {
  const schema = z.array(
    z.object({
      id: z.number().int().positive(),
      cost: z.number().min(0).max(100000).nullable(),
    })
  );

  const validatedUpdates = schema.parse(updates);
  const count = await bulkUpdateProductCosts(validatedUpdates);
  revalidatePath("/admin/profitability");

  return { success: true, updatedCount: count };
}

// ============ Shipping Actions ============

export async function fetchShippingMethods () {
  return getShippingMethods();
}

export async function fetchShippingMethod (id: number) {
  return getShippingMethod(id);
}

export async function fetchShippingMethodsWithoutCost () {
  return getShippingMethodsWithoutCost();
}

export async function updateShippingMethodCostAction (id: number, cost: number | null) {
  const idSchema = z.number().int().positive();
  const costSchema = z.number().min(0).max(10000).nullable();

  const validatedId = idSchema.parse(id);
  const validatedCost = costSchema.parse(cost);

  const updated = await updateShippingMethodCost(validatedId, validatedCost);
  revalidatePath("/admin/profitability");

  return { success: true, shippingMethod: updated };
}

export async function updateShippingMethodAction (
  id: number,
  data: { name?: string; provider?: string; cost?: number | null; isActive?: boolean }
) {
  const idSchema = z.number().int().positive();
  const dataSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    provider: z.enum(["nacex", "correos", "otro"]).optional(),
    cost: z.number().min(0).max(10000).nullable().optional(),
    isActive: z.boolean().optional(),
  });

  const validatedId = idSchema.parse(id);
  const validatedData = dataSchema.parse(data);

  // Convertir cost de number a string para la base de datos
  const dataForDb = {
    ...validatedData,
    cost: validatedData.cost !== undefined
      ? (validatedData.cost !== null ? validatedData.cost.toString() : null)
      : undefined,
  };

  const updated = await updateShippingMethod(validatedId, dataForDb);
  revalidatePath("/admin/profitability");

  return { success: true, shippingMethod: updated };
}
