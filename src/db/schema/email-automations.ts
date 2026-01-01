import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import automationSteps from "./automations-stepts";

const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type", { length: 100 }).notNull(), // nuevo-suscriptor, compra, abandono-carrito, etc.
  triggerSettings: jsonb("trigger_settings").notNull(), // Configuración del trigger
  status: text("status").notNull(), // pending, processing, completed, failed, paused
  isActive: boolean("is_active").default(true).notNull(),
  orderId: integer("order_id"), // Campo para prevenir duplicados con índice único
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Índice único compuesto para prevenir duplicados: solo una automatización por orderId y triggerType
  uniqueIndex("unique_order_trigger").on(table.orderId, table.triggerType),
  // Índice para búsquedas por status y isActive (usado por el CRON)
  index("idx_status_active").on(table.status, table.isActive),
]);

export const emailAutomationsRelations = relations(emailAutomations, ({ many }) => ({
  steps: many(automationSteps),
}));

export const emailAutomationSelectSchema = createSelectSchema(emailAutomations);
export const emailAutomationInsertSchema = createInsertSchema(emailAutomations);

export default emailAutomations;
