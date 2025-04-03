import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

import emailSends from "./email-sends";
import subscribers from "./subscribers";

// Tabla para almacenar las solicitudes de notificación de stock
const stockNotifications = pgTable("stock_notifications", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id")
    .references(() => subscribers.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id").notNull(), // ID del producto en WooCommerce
  productName: varchar("product_name", { length: 255 }).notNull(),
  productSku: varchar("product_sku", { length: 100 }).notNull(),
  variant: varchar("variant", { length: 100 }), // Puede ser talla, color, etc.
  requestDate: timestamp("request_date").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, notified, cancelled
  notifiedAt: timestamp("notified_at"), // Cuando se envió la notificación
  expiresAt: timestamp("expires_at"), // Opcional: fecha de caducidad de la solicitud
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata"), // Datos adicionales como detalles del producto
});

// Relaciones para las notificaciones de stock
export const stockNotificationsRelations = relations(stockNotifications, ({ one, many }) => ({
  subscriber: one(subscribers, {
    fields: [stockNotifications.subscriberId],
    references: [subscribers.id],
  }),
  // También podemos relacionar con los envíos de email para seguimiento
  emailSends: many(emailSends),
}));

export const stockNotificationsSelectSchema = createSelectSchema(stockNotifications);

export default stockNotifications;
