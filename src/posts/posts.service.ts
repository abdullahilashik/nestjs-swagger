import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';

import * as schema from '../database/schema';
import type { SqliteDatabase } from '../database/drizzle.type';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectDrizzle()
        private readonly db: SqliteDatabase
    ) { }

    // create a new post with image upload
    async createPost(post: CreatePostDto) {
        // create the record and send it back
        // return await this.db.insert(schema.postsTable).values(post).returning();
    }
}
