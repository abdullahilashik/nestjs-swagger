import {
    sqliteTable,
    integer,
    text
} from 'drizzle-orm/sqlite-core';
import { usersTable } from './users.schema';


export const postsTable = sqliteTable('posts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    image: text('image').notNull()
});

export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;