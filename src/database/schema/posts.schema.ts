import { baseSchema } from "./base";
import { boolean, integer, json, pgTable, text } from "drizzle-orm/pg-core";

// export const posts = sqliteTable('posts', {
//     ...baseSchema,
//     title: text('title').notNull(),
//     slug: text('slug').notNull().unique(),
//     content: text('content').notNull(),
//     status: text('status', {
//         enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
//     }).notNull().default('DRAFT'),
//     // storing structured json metadata in sqlite/postgres text
//     metadata: text('metadata', { mode: 'json' }).$type<{
//         seoDescription?: string;
//         canonicalUrl?: string;
//     }>(),
//     viewCount: integer('view_count').default(0).notNull(),
//     internalAuditFlag: integer('internal_audit_flag', { mode: 'boolean' }).default(false).notNull()
// });

export const posts = pgTable('posts', {
    ...baseSchema,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content').notNull(),
    status: text('status', {
        enum: ['DRAFT', 'PUBLISHED','ARCHIVED']
    }).notNull().default('DRAFT'),
    metadata: json('metadata').$type<{
        seoDescription?: string,
        canonicalUrl?: string
    }>(),
    viewCount: integer('view_count').default(0).notNull(),
    internalAuditFlag: boolean('internal_audit_flag').default(false).notNull()
});

export type PostRecord = typeof posts.$inferSelect;
export type NewPostRecord = typeof posts.$inferInsert;