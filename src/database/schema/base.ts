// import { sql } from 'drizzle-orm';
// import { integer, text } from 'drizzle-orm/sqlite-core';

import { timestamp, integer } from "drizzle-orm/pg-core";

// export const baseSchema = {
//     id: integer('id').primaryKey({ autoIncrement: true }),
//     createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
//     updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull()
// };


export const baseSchema = {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
}