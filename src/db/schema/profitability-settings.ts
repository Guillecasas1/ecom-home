import { pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const profitabilitySettings = pgTable("profitability_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull(),
  value: varchar("value", { length: 500 }).notNull(),
  description: varchar("description", { length: 500 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("profitability_settings_key_unique").on(table.key),
]);

// Claves de configuración conocidas:
// - "packaging_cost": Coste de empaquetado por pedido (ej: "0.90")

export const profitabilitySettingsSelectSchema = createSelectSchema(profitabilitySettings);
export const profitabilitySettingsInsertSchema = createInsertSchema(profitabilitySettings);

export default profitabilitySettings;
