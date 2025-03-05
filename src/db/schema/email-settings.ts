import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

// Tabla de configuración del servicio de email
const emailSettings = pgTable('email_settings', {
  id: serial('id').primaryKey(),
  providerType: varchar('provider_type', { length: 100 }).notNull(), // sendgrid, mailchimp, ses, etc.
  providerConfig: jsonb('provider_config').notNull(), // Configuración API del proveedor
  defaultFromName: varchar('default_from_name', { length: 100 }).notNull(),
  defaultFromEmail: varchar('default_from_email', { length: 255 }).notNull(),
  defaultReplyTo: varchar('default_reply_to', { length: 255 }),
  sendLimit: integer('send_limit'), // Límite de envíos diarios (si aplica)
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export default emailSettings;