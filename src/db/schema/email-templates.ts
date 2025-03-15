import { boolean, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(), // Contenido HTML del email
  previewText: text("preview_text"), // Texto de vista previa del email
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  category: varchar("category", { length: 100 }), // Categoría (promocional, transaccional, etc.)
  metadata: jsonb("metadata"), // Para datos adicionales flexibles
});

export default emailTemplates;
