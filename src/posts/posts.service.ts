import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';

import * as schema from '../database/schema';
import type { SqliteDatabase } from '../database/drizzle.type';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class PostsService {
    constructor(
        @InjectDrizzle()
        private readonly db: SqliteDatabase
    ) { }

    private toResponseBody(record: schema.PostRecord) {
        return {
            id: record.id,
            title: record.title,
            slug: record.slug,
            content: record.content,
            status: record.status as any,
            metadata: record.metadata ?? null,
            viewCount: record.viewCount || 0,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        }
    }

    // create a new post with image upload
    async createPost(post: CreatePostDto): Promise<PostResponseDto> {
        try {

            const existing = await this.db
                .select()
                .from(schema.posts)
                .where(eq(schema.posts.slug, post.slug))
                .get();

            if (existing) {
                throw new ConflictException(`Post with slug '${post.slug}' already exists.`);
            }

            // create the record and send it back
            const inserted = await this.db.insert(schema.posts)
                .values({
                    title: post.title,
                    slug: post.slug,
                    content: post.content,
                    status: post.status ?? 'DRAFT',
                    metadata: post.metadata ?? null,
                    internalAuditFlag: false, // Explicitly controlled by the system not the client
                })
                .returning()
                .get();

            return this.toResponseBody(inserted);
        } catch (error: any) {
            if (error instanceof ConflictException) throw error;

            if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE constraint failed')) {
                throw new ConflictException(`Post with slug ${post.slug} already exists`);
            }

            throw error;
        }
    }

    async findBySlug(slug: string): Promise<PostResponseDto> {
        const record = await this.db
            .select()
            .from(schema.posts)
            .where(eq(schema.posts.slug, slug))
            .get();
        if (!record) throw new NotFoundException(`Post with slug ${slug} not found`);
        return this.toResponseBody(record);
    }
}
