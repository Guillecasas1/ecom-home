import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import emailCampaigns from "./email-campaigns";
import emailEvents from "./email-events";
import subscribers from "./subscribers";

const emailSends = pgTable("email_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id, {
    onDelete: "set null",
  }),
  subscriberId: integer("subscriber_id")
    .references(() => subscribers.id, { onDelete: "cascade" })
    .notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("sent"), // sent, delivered, bounced, etc.
  openedAt: timestamp("opened_at"),
  bounceReason: text("bounce_reason"),
  emailContent: text("email_content"), // Contenido real enviado (para histórico)
  metadata: jsonb("metadata"),
});

export const emailSendsRelations = relations(emailSends, ({ one, many }) => ({
  campaign: one(emailCampaigns, {
    fields: [emailSends.campaignId],
    references: [emailCampaigns.id],
  }),
  subscriber: one(subscribers, {
    fields: [emailSends.subscriberId],
    references: [subscribers.id],
  }),
  events: many(emailEvents),
}));

export default emailSends;
