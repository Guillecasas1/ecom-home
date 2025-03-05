import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import emailSends from "./email-sends";
import emailTemplates from "./email-templates";
import subscriberLists from "./subscriber-lists";

const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  listId: integer("list_id")
    .references(() => subscriberLists.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  subject: varchar("subject", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 100 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  replyTo: varchar("reply_to", { length: 255 }),
  templateId: integer("template_id").references(() => emailTemplates.id, {
    onDelete: "set null",
  }),
  content: text("content"), // Contenido si no usa una plantilla
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, scheduled, sending, sent, cancelled
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tags: jsonb("tags"),
  segmentationRules: jsonb("segmentation_rules"), // Reglas de segmentación en formato JSON
});

export const emailCampaignsRelations = relations(
  emailCampaigns,
  ({ one, many }) => ({
    template: one(emailTemplates, {
      fields: [emailCampaigns.templateId],
      references: [emailTemplates.id],
    }),
    lists: many(subscriberLists),
    sends: many(emailSends),
  })
);

export default emailCampaigns;
