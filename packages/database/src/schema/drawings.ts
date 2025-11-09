import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const drawings = sqliteTable('drawings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  type: text('type').notNull().default('drawing'),
  data: text('data'),
  createdAt: text('created_at').default(new Date().toISOString()),
  updatedAt: text('updated_at').default(new Date().toISOString()),
});

export const drawingAssets = sqliteTable('drawing_assets', {
  id: text('id').primaryKey(),
  drawingId: text('drawing_id').notNull().references(() => drawings.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: text('file_size').notNull(),
  url: text('url').notNull(),
  createdAt: text('created_at').default(new Date().toISOString()),
});

// Self-referencing relations need to be handled separately
export const drawingsRelations = relations(drawings, ({ one, many }) => ({
  user: one(users, {
    fields: [drawings.userId],
    references: [users.id],
  }),
  assets: many(drawingAssets),
}));

export const drawingAssetsRelations = relations(drawingAssets, ({ one }) => ({
  drawing: one(drawings, {
    fields: [drawingAssets.drawingId],
    references: [drawings.id],
  }),
  user: one(users, {
    fields: [drawingAssets.userId],
    references: [users.id],
  }),
}));