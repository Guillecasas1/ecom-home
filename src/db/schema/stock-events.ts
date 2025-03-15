import { integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

const stockEvents = pgTable("stock_events", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productSku: varchar("product_sku", { length: 100 }).notNull(),
  variant: varchar("variant", { length: 100 }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // restock, out_of_stock
  quantity: integer("quantity").notNull().default(0),
  eventDate: timestamp("event_date").defaultNow().notNull(),
  processedAt: timestamp("processed_at"), // Cuándo se procesaron notificaciones
  metadata: jsonb("metadata"),
});

export default stockEvents;
