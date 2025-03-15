import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import emailSends from "./email-sends";

const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  emailSendId: integer("email_send_id")
    .references(() => emailSends.id, { onDelete: "cascade" })
    .notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // open, click, bounce, spam, unsubscribe
  eventTime: timestamp("event_time").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  url: text("url"), // Si es un clic, la URL clicada
  metadata: jsonb("metadata"), // Información adicional del evento
});

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  emailSend: one(emailSends, {
    fields: [emailEvents.emailSendId],
    references: [emailSends.id],
  }),
}));

export default emailEvents;
