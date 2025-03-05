import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

import emailAutomations from "./email-automations";
import emailTemplates from "./email-templates";

const automationSteps = pgTable("automation_steps", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id")
    .references(() => emailAutomations.id, { onDelete: "cascade" })
    .notNull(),
  stepOrder: integer("step_order").notNull(),
  stepType: varchar("step_type", { length: 100 }).notNull(), // enviar-email, esperar, condición, etc.
  templateId: integer("template_id").references(() => emailTemplates.id, {
    onDelete: "set null",
  }),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  waitDuration: integer("wait_duration"), // En minutos, si el tipo es "esperar"
  conditions: jsonb("conditions"), // Para pasos condicionales
  isActive: boolean("is_active").default(true).notNull(),
});

export const automationStepsRelations = relations(
  automationSteps,
  ({ one }) => ({
    automation: one(emailAutomations, {
      fields: [automationSteps.automationId],
      references: [emailAutomations.id],
    }),
    template: one(emailTemplates, {
      fields: [automationSteps.templateId],
      references: [emailTemplates.id],
    }),
  })
);

export default automationSteps;
