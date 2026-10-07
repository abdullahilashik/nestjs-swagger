import {
    sqliteTable,
    integer,
    text
} from 'drizzle-orm/sqlite-core';
import { baseSchema } from './base';


export const usersTable = sqliteTable('users', {
    ...baseSchema,
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull().unique()
});


export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;