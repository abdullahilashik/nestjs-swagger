import {integer, text} from 'drizzle-orm/sqlite-core';

export const baseSchema = {
    id: integer('id').primaryKey({autoIncrement: true}),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString())
};