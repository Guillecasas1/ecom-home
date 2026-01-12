import { relations } from "drizzle-orm";
import { decimal, index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import wcOrderItems from "./wc-order-items";
import shippingMethods from "./shipping-methods";

const wcOrders = pgTable("wc_orders", {
  id: serial("id").primaryKey(),
  wcOrderId: integer("wc_order_id").notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  // Importes de venta (lo que paga el cliente)
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingTotal: decimal("shipping_total", { precision: 10, scale: 2 }).notNull().default("0"),
  // Método de envío
  shippingMethodId: integer("shipping_method_id").references(() => shippingMethods.id),
  shippingMethodTitle: varchar("shipping_method_title", { length: 255 }),
  wcShippingMethodId: varchar("wc_shipping_method_id", { length: 100 }),
  // Cliente
  customerEmail: varchar("customer_email", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  // Fechas
  orderDate: timestamp("order_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("wc_orders_wc_order_id_unique").on(table.wcOrderId),
  index("wc_orders_order_date_idx").on(table.orderDate),
  index("wc_orders_status_idx").on(table.status),
]);

export const wcOrdersRelations = relations(wcOrders, ({ one, many }) => ({
  items: many(wcOrderItems),
  shippingMethod: one(shippingMethods, {
    fields: [wcOrders.shippingMethodId],
    references: [shippingMethods.id],
  }),
}));

export const wcOrderSelectSchema = createSelectSchema(wcOrders);
export const wcOrderInsertSchema = createInsertSchema(wcOrders);

export default wcOrders;
