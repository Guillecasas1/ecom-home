import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import automationSteps from "./automations-stepts";

const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type", { length: 100 }).notNull(), // nuevo-suscriptor, compra, abandono-carrito, etc.
  triggerSettings: jsonb("trigger_settings").notNull(), // Configuración del trigger
  status: text("status").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailAutomationsRelations = relations(emailAutomations, ({ many }) => ({
  steps: many(automationSteps),
}));

export const emailAutomationSelectSchema = createSelectSchema(emailAutomations);
export const emailAutomationInsertSchema = createInsertSchema(emailAutomations);

export default emailAutomations;
