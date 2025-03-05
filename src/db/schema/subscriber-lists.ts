import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import emailCampaigns from './email-campaigns';
import subscribers from './subscribers';

const subscriberLists = pgTable('subscriber_lists', {
  id: serial('id').primaryKey(),
  subscriberId: integer('subscriber_id').references(() => subscribers.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull()
});

export const subscriberListsRelations = relations(subscriberLists, ({ many }) => ({
  subscribers: many(subscribers),
  campaigns: many(emailCampaigns)
}));

export default subscriberLists;