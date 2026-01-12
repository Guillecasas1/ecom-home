import { relations } from "drizzle-orm";
import { decimal, index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import wcOrders from "./wc-orders";
import products from "./products";

const wcOrderItems = pgTable("wc_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => wcOrders.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id").references(() => products.id),
  // Datos de WooCommerce
  wcProductId: integer("wc_product_id").notNull(),
  wcVariationId: integer("wc_variation_id"),
  name: varchar("name", { length: 500 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").notNull().default(1),
  // Precios de venta (lo que paga el cliente)
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  // Costes (lo que nos cuesta a nosotros) - Se calcula automáticamente desde products
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  // Fechas
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("wc_order_items_order_id_idx").on(table.orderId),
  index("wc_order_items_product_id_idx").on(table.productId),
  index("wc_order_items_wc_product_id_idx").on(table.wcProductId),
]);

export const wcOrderItemsRelations = relations(wcOrderItems, ({ one }) => ({
  order: one(wcOrders, {
    fields: [wcOrderItems.orderId],
    references: [wcOrders.id],
  }),
  product: one(products, {
    fields: [wcOrderItems.productId],
    references: [products.id],
  }),
}));

export const wcOrderItemSelectSchema = createSelectSchema(wcOrderItems);
export const wcOrderItemInsertSchema = createInsertSchema(wcOrderItems);

export default wcOrderItems;
