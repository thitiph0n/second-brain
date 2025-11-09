import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  type: text('type').notNull().default('food'),
  description: text('description'),
  expiresAt: text('expires_at'),
  isUsed: integer('is_used', { mode: 'boolean' }).default(false),
  usedAt: text('used_at'),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const couponsRelations = relations(coupons, ({ one }) => ({
  user: one(users, {
    fields: [coupons.userId],
    references: [users.id],
  }),
}));