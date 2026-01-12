import { relations } from "drizzle-orm";
import { boolean, decimal, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import wcOrders from "./wc-orders";

const shippingMethods = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  wcMethodId: varchar("wc_method_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // 'nacex' | 'correos'
  // Coste del envío (lo que nos cuesta a nosotros)
  cost: decimal("cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  // Fechas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("shipping_methods_wc_method_id_unique").on(table.wcMethodId),
]);

export const shippingMethodsRelations = relations(shippingMethods, ({ many }) => ({
  orders: many(wcOrders),
}));

export const shippingMethodSelectSchema = createSelectSchema(shippingMethods);
export const shippingMethodInsertSchema = createInsertSchema(shippingMethods);

export default shippingMethods;
