import { asc, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, wcOrderItems } from "@/db/schema";
import { Product, ProductWithStats } from "../types";

export type ProductsFilter = {
  search?: string;
  onlyWithoutCost?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "sku" | "currentCost" | "totalQuantitySold" | "totalRevenue";
  sortOrder?: "asc" | "desc";
};

export async function getProducts(filter: ProductsFilter = {}): Promise<{
  products: ProductWithStats[];
  total: number;
}> {
  const {
    search,
    onlyWithoutCost = false,
    page = 1,
    pageSize = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = filter;

  const offset = (page - 1) * pageSize;

  // Construir condiciones
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`)
      )
    );
  }

  if (onlyWithoutCost) {
    conditions.push(isNull(products.currentCost));
  }

  const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

  // Contar total
  const totalQuery = db
    .select({ count: count() })
    .from(products);

  if (whereClause) {
    totalQuery.where(whereClause);
  }

  const [totalResult] = await totalQuery;

  // Obtener productos con estadísticas
  const productsQuery = db
    .select({
      id: products.id,
      wcProductId: products.wcProductId,
      wcVariationId: products.wcVariationId,
      sku: products.sku,
      name: products.name,
      currentCost: products.currentCost,
      costUpdatedAt: products.costUpdatedAt,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      totalQuantitySold: sql<number>`COALESCE(SUM(${wcOrderItems.quantity}), 0)`.as("total_quantity_sold"),
      totalRevenue: sql<number>`COALESCE(SUM(${wcOrderItems.totalPrice}::numeric), 0)`.as("total_revenue"),
      totalCost: sql<number | null>`
        CASE 
          WHEN ${products.currentCost} IS NULL THEN NULL 
          ELSE COALESCE(SUM(${wcOrderItems.totalCost}::numeric), 0)
        END
      `.as("total_cost"),
    })
    .from(products)
    .leftJoin(wcOrderItems, eq(wcOrderItems.productId, products.id))
    .groupBy(products.id);

  if (whereClause) {
    productsQuery.where(whereClause);
  }

  // Ordenar
  const orderByColumn = {
    name: products.name,
    sku: products.sku,
    currentCost: products.currentCost,
    totalQuantitySold: sql`total_quantity_sold`,
    totalRevenue: sql`total_revenue`,
  }[sortBy];

  if (sortOrder === "desc") {
    productsQuery.orderBy(desc(orderByColumn));
  } else {
    productsQuery.orderBy(asc(orderByColumn));
  }

  productsQuery.limit(pageSize).offset(offset);

  const productsData = await productsQuery;

  // Calcular beneficio para cada producto
  const productsWithStats: ProductWithStats[] = productsData.map((p) => {
    const totalProfit =
      p.currentCost !== null && p.totalCost !== null
        ? p.totalRevenue - p.totalCost
        : null;

    return {
      id: p.id,
      wcProductId: p.wcProductId,
      wcVariationId: p.wcVariationId,
      sku: p.sku,
      name: p.name,
      currentCost: p.currentCost,
      costUpdatedAt: p.costUpdatedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      totalQuantitySold: Number(p.totalQuantitySold),
      totalRevenue: Number(p.totalRevenue),
      totalCost: p.totalCost !== null ? Number(p.totalCost) : null,
      totalProfit,
    };
  });

  return { products: productsWithStats, total: totalResult.count };
}

export async function getProduct(id: number): Promise<Product | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product || null;
}

export async function updateProductCost(
  id: number,
  cost: number | null
): Promise<Product> {
  const [updated] = await db
    .update(products)
    .set({
      currentCost: cost?.toString() || null,
      costUpdatedAt: cost !== null ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  // Actualizar los costes en los items de pedidos existentes
  if (cost !== null) {
    await db
      .update(wcOrderItems)
      .set({
        unitCost: cost.toString(),
        totalCost: sql`${cost} * ${wcOrderItems.quantity}`,
      })
      .where(eq(wcOrderItems.productId, id));
  }

  return updated;
}

export async function bulkUpdateProductCosts(
  updates: { id: number; cost: number | null }[]
): Promise<number> {
  let updatedCount = 0;

  for (const update of updates) {
    await updateProductCost(update.id, update.cost);
    updatedCount++;
  }

  return updatedCount;
}

export async function getProductsWithoutCost(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(isNull(products.currentCost))
    .orderBy(asc(products.name));
}

export async function countProductsWithoutCost(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(products)
    .where(isNull(products.currentCost));

  return result.count;
}
