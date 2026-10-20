import { baseSchema } from './base';
import { pgTable, text } from 'drizzle-orm/pg-core';


export const usersTable = pgTable('users', {
    ...baseSchema,
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull().unique()
});


export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;