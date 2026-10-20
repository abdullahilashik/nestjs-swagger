import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';

import * as schema from '../database/schema';
import type {
  DatabaseDriverPg,
} from '../database/drizzle.type';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { eq } from 'drizzle-orm';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectDrizzle()
    private readonly db: DatabaseDriverPg,
  ) {}

  private toResponseBody(record: schema.PostRecord) {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      content: record.content,
      status: record.status as any,
      metadata: record.metadata ?? null,
      viewCount: record.viewCount || 0,
      createdAt: record.createdAt as Date,
      updatedAt: record.updatedAt as Date,
    };
  }

  // get all post data
  async getAllPosts(payload: FindPostsQueryDto): Promise<PostResponseDto[]> {
    const posts = await this.db
      .select()
      .from(schema.posts)
      .limit(payload?.limit)
      .offset((payload.page - 1) * payload.limit);
    const result = posts.map((item) => this.toResponseBody(item));

    return result;
  }

  // create a new post with image upload
  async createPost(post: CreatePostDto): Promise<PostResponseDto> {
    try {
      const existing = await this.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.slug, post.slug));

      if (existing) {
        throw new ConflictException(
          `Post with slug '${post.slug}' already exists.`,
        );
      }

      // create the record and send it back
      const [posts] = await this.db
        .insert(schema.posts)
        .values({
          title: post.title,
          slug: post.slug,
          content: post.content,
          status: post.status ?? 'DRAFT',
          metadata: post.metadata ?? null,
          internalAuditFlag: false, // Explicitly controlled by the system not the client
        })
        .returning();

      return this.toResponseBody(posts);
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;

      if (
        error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error?.code === 'SQLITE_CONSTRAINT' ||
        error?.message?.includes('UNIQUE constraint failed')
      ) {
        throw new ConflictException(
          `Post with slug ${post.slug} already exists`,
        );
      }

      throw error;
    }
  }

  async findBySlug(slug: string): Promise<PostResponseDto> {
    const [posts] = await this.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.slug, slug));
    if (!posts) throw new NotFoundException(`Post with slug ${slug} not found`);
    return this.toResponseBody(posts);
  }
}
