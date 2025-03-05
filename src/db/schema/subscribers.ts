import { relations } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import subscriberLists from "./subscriber-lists";

const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  customAttributes: jsonb("custom_attributes"), // Atributos personalizados para segmentación
  source: varchar("source", { length: 100 }), // Origen del suscriptor (checkout, formulario, etc.)
});

export const subscribersRelations = relations(subscribers, ({ many }) => ({
  listRelations: many(subscriberLists),
}));

export default subscribers;
