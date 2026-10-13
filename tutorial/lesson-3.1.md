This behavior reveals a fundamental rule of enterprise NestJS architecture:

### Why did you get a generic "Internal Server Error" (500)?

In NestJS, any error that is **not** an instance of `HttpException` (such as an unhandled database error, SQL constraint failure, or missing table) is intercepted by NestJS's default global exception layer. 

For security reasons, NestJS **masks raw database errors** from API clients to prevent leaking database names, column structures, and SQL queries to attackers. Instead, it returns:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

If our `ConflictException` had executed, you would have received an **HTTP 409 Conflict** with your custom message. Because you received a **500**, the code failed before that check or threw an unhandled database exception directly.

---

### The 3 Likely Culprits & Their Fixes

Check your terminal where `npm run start:dev` is running. You will see the exact stack trace. Here is how to fix the three most common causes:

---

#### Culprit 1: The Injection Decorator (`@InjectDrizzle`)
If you used the official `@nestjs/drizzle` package, the correct way to inject the database instance is using `@InjectDrizzle()`, not `@Inject('DRIZZLE_CORE_MODULE_CONNECTION')`. 

If `this.db` was injected incorrectly, it evaluated to `undefined`, throwing `TypeError: Cannot read properties of undefined (reading 'select')`.

**The Fix in `src/posts/posts.service.ts`:**
```typescript
import { InjectDrizzle } from '@nestjs/drizzle';
// ... other imports

@Injectable()
export class PostsService {
  constructor(
    @InjectDrizzle() private readonly db: any, // 👈 Use @InjectDrizzle()
  ) {}
  // ...
```

---

#### Culprit 2: The Table Does Not Exist Yet in `file:local.db`
When connecting to `file:local.db`, SQLite creates a fresh, empty file. If you haven't pushed your schema yet, the `posts` table does not exist, and querying it throws:  
`LibsqlError: SQLITE_ERROR: no such table: posts`.

**The Fix:**  
Ensure the table is created. You can run `npx drizzle-kit push` if your `drizzle.config.ts` is configured, or add an automated initialization check on bootstrap:

Add an `onModuleInit` hook directly in `src/posts/posts.service.ts` to guarantee the table exists in your local SQLite file:

```typescript
// src/posts/posts.service.ts
import { Injectable, OnModuleInit, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import { posts, PostRecord } from './posts.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @InjectDrizzle() private readonly db: any,
  ) {}

  // Automatically ensure table exists in local SQLite file
  async onModuleInit() {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        metadata TEXT,
        view_count INTEGER NOT NULL DEFAULT 0,
        internal_audit_flag INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // ... rest of create and findBySlug methods
```

---

#### Culprit 3: Handling Database Race Conditions / Direct Constraint Errors
In production, checking `if (existing)` before `insert()` is prone to race conditions (two requests hitting at the exact same millisecond). If a duplicate slips past the `existing` check, SQLite/PostgreSQL throws a raw `SQLITE_CONSTRAINT: UNIQUE` error, which triggers an unhandled 500.

An enterprise service wraps database operations or handles driver errors explicitly:

```typescript
  async create(dto: CreatePostDto): Promise<PostResponseDto> {
    try {
      // 1. Check existing record
      const existing = await this.db
        .select()
        .from(posts)
        .where(eq(posts.slug, dto.slug))
        .get();

      if (existing) {
        throw new ConflictException(`Post with slug '${dto.slug}' already exists.`);
      }

      // 2. Safe mapping & insert
      const inserted = await this.db
        .insert(posts)
        .values({
          title: dto.title,
          slug: dto.slug,
          content: dto.content,
          status: dto.status ?? 'DRAFT',
          metadata: dto.metadata ?? null,
          internalAuditFlag: false,
        })
        .returning()
        .get();

      return this.toResponseDto(inserted);
    } catch (error: any) {
      // If it's already an HTTP Exception (like our ConflictException), rethrow it
      if (error instanceof ConflictException) {
        throw error;
      }

      // Catch SQLite / LibSQL unique constraint violation (code: SQLITE_CONSTRAINT)
      if (error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE constraint failed')) {
        throw new ConflictException(`Post with slug '${dto.slug}' already exists.`);
      }

      // Re-throw any genuine internal errors
      throw error;
    }
  }
```

---

### Test It Now

1. Update `posts.service.ts` with `@InjectDrizzle()`, the `onModuleInit` table creation, and the try/catch block.
2. Restart your development server (`npm run start:dev`).
3. Send a POST request with a new post. It should return **201 Created**.
4. Send the **exact same request again**.
5. You should now receive an **HTTP 409 Conflict** with the detailed message:
   ```json
   {
     "message": "Post with slug 'enterprise-architecture-with-nestjs' already exists.",
     "error": "Conflict",
     "statusCode": 409
   }
   ```

*(Note: In **Module 5**, we will build an automated Global Exception Filter that translates database errors across the entire app so you never have to write driver-specific try/catch blocks manually).*

Verify this returns the 409 error in your Swagger UI, and let me know when you're ready for **Module 4**!