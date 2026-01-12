import { relations } from "drizzle-orm";
import { decimal, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import wcOrderItems from "./wc-order-items";

const products = pgTable("products", {
  id: serial("id").primaryKey(),
  wcProductId: integer("wc_product_id").notNull(),
  wcVariationId: integer("wc_variation_id"),
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 500 }).notNull(),
  // Coste actual del producto
  currentCost: decimal("current_cost", { precision: 10, scale: 2 }),
  costUpdatedAt: timestamp("cost_updated_at"),
  // Fechas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Índice único compuesto: producto + variación
  uniqueIndex("products_wc_product_variation_unique").on(table.wcProductId, table.wcVariationId),
]);

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(wcOrderItems),
}));

export const productSelectSchema = createSelectSchema(products);
export const productInsertSchema = createInsertSchema(products);

export default products;
