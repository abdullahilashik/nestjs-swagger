# Module 3: Contract Modeling — DTOs, Validation & Database Isolation

---

## 1. The Architectural Danger: The "Leaky Abstraction" Trap

In junior and rapid-prototyping tutorials, developers often export their ORM schema directly to the controller:

```typescript
// ❌ CRITICAL ENTERPRISE ANTI-PATTERN
@Post()
async create(@Body() rawDatabaseRow: typeof postsTable.$inferInsert) {
  return this.db.insert(postsTable).values(rawDatabaseRow);
}
```

### Why this is dangerous in enterprise systems:

1. **Massive Over-Posting Vulnerability:**  
   If your database table has columns like `is_admin`, `verified_at`, `tenant_id`, or `internal_rating`, an attacker can send them in the JSON body. Without explicit DTO whitelisting, the ORM might write them directly to the database.
2. **Tight Coupling / Contract Breakage:**  
   If a DBA renames a column in PostgreSQL/SQLite from `user_full_name` to `legal_name`, your API contract breaks for every frontend, mobile app, and third-party consumer immediately.
3. **ORM Metadata Leaks:**  
   Drizzle schema types do not inherently contain the HTTP-layer constraints needed for OpenAPI: regex patterns, example payloads, masking rules, or HTTP status codes.

> **Enterprise Architecture Law:**  
> **Database Schemas** model *storage, indexes, foreign keys, and relations*.  
> **API Contracts (DTOs)** model *intent, network boundaries, input sanitization, and output masking*.  
> They must remain decoupled.

---

## 2. Setting Up the Drizzle Schema Layer

Let's define a clean Drizzle table for `posts`.

Create or update `src/posts/posts.schema.ts` (using standard Drizzle SQLite syntax that matches your `file:local.db` configuration):

```typescript
// src/posts/posts.schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  status: text('status', { enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
    .default('DRAFT')
    .notNull(),
  // Storing structured JSON metadata in SQLite/Postgres text
  metadata: text('metadata', { mode: 'json' }).$type<{
    seoDescription?: string;
    canonicalUrl?: string;
  }>(),
  viewCount: integer('view_count').default(0).notNull(),
  internalAuditFlag: integer('internal_audit_flag', { mode: 'boolean' })
    .default(false)
    .notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type PostRecord = typeof posts.$inferSelect;
export type NewPostRecord = typeof posts.$inferInsert;
```

Notice `internalAuditFlag` and `viewCount`. These are **internal database concerns** that consumers should **never** be allowed to set during a POST request.

---

## 3. Modeling Complex Request Contracts (Nested Objects & Custom Scalars)

Enterprise payloads frequently contain nested objects (e.g., SEO metadata, addresses, configurations). Let's model this using `class-validator` and `class-transformer` so the Swagger AST plugin can parse the full tree.

### Step 3.1: Define the Nested Child DTO
Create `src/posts/dto/post-metadata.dto.ts`:

```typescript
// src/posts/dto/post-metadata.dto.ts
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class PostMetadataDto {
  /**
   * Search engine description snippet
   * @example "Comprehensive guide to enterprise NestJS architectures"
   */
  @IsString()
  @MaxLength(160)
  @IsOptional()
  seoDescription?: string;

  /**
   * Canonical URL for SEO deduplication
   * @example "https://enterprise.internal/blog/nestjs-scale"
   */
  @IsUrl()
  @IsOptional()
  canonicalUrl?: string;
}
```

---

### Step 3.2: Build a Custom Enterprise Validator (`@IsSlug`)

Enterprise contracts often require custom business validation (e.g., Tax IDs, slugs, IBANs). Let's write a reusable `@IsSlug()` validator that integrates cleanly with `class-validator`:

Create `src/common/validators/is-slug.validator.ts`:

```typescript
// src/common/validators/is-slug.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be a valid URL-safe slug (lowercase letters, numbers, and hyphens only)`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Matches kebab-case slugs: e.g. "my-first-post-2026"
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
        },
      },
    });
  };
}
```

---

### Step 3.3: Upgrade `CreatePostDto` with Nested Validation & Constraints

Update `src/posts/dto/create-post.dto.ts`:

```typescript
// src/posts/dto/create-post.dto.ts
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostMetadataDto } from './post-metadata.dto';
import { IsSlug } from '../../common/validators/is-slug.validator';

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreatePostDto {
  /**
   * Primary title of the post
   * @example "Enterprise Architecture with NestJS"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  /**
   * Unique URL-friendly slug identifier
   * @example "enterprise-architecture-with-nestjs"
   */
  @IsSlug()
  @IsNotEmpty()
  slug: string;

  /**
   * Markdown or raw HTML body content
   * @example "## Architectural Overview\n\nThis article outlines..."
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * Publication lifecycle state
   * @default "DRAFT"
   */
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus = PostStatus.DRAFT;

  /**
   * Nested search optimization metadata
   */
  @ValidateNested()
  @Type(() => PostMetadataDto)
  @IsOptional()
  metadata?: PostMetadataDto;
}
```

> **Why `@Type(() => PostMetadataDto)` is required:**  
> Due to JavaScript type erasure at runtime, `class-transformer` has no idea that incoming plain JSON objects inside `metadata` need to be instantiated into instances of `PostMetadataDto`. Without `@Type()`, `@ValidateNested()` will silently ignore validation on nested fields!

---

## 4. Modeling Response Contracts (Strict Output Masking)

Never return your raw Drizzle database entities from a controller. If you do, you risk exposing columns like `internalAuditFlag` or unformatted timestamps.

Create a dedicated response model: `src/posts/dto/post-response.dto.ts`:

```typescript
// src/posts/dto/post-response.dto.ts
import { PostStatus } from './create-post.dto';
import { PostMetadataDto } from './post-metadata.dto';

export class PostResponseDto {
  /**
   * Database primary key identifier
   * @example 42
   */
  id: number;

  /**
   * Human readable post title
   * @example "Enterprise Architecture with NestJS"
   */
  title: string;

  /**
   * Unique URL slug
   * @example "enterprise-architecture-with-nestjs"
   */
  slug: string;

  /**
   * Post publication content
   * @example "## Architectural Overview..."
   */
  content: string;

  /**
   * Publication lifecycle state
   * @example "PUBLISHED"
   */
  status: PostStatus;

  /**
   * Search optimization metadata
   */
  metadata: PostMetadataDto | null;

  /**
   * Total public views count
   * @example 1250
   */
  viewCount: number;

  /**
   * ISO 8601 UTC creation timestamp
   * @example "2026-10-12T16:24:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 UTC last update timestamp
   * @example "2026-10-12T16:30:00.000Z"
   */
  updatedAt: string;

  // Notice: internalAuditFlag is strictly EXCLUDED here.
}
```

---

## 5. Connecting DTOs, Service, and Controller

Let's implement the mapper pattern inside your service to transform Drizzle records into the public API contract.

### Step 5.1: The Service Layer (`src/posts/posts.service.ts`)
Create or update `src/posts/posts.service.ts`:

```typescript
// src/posts/posts.service.ts
import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { posts, PostRecord } from './posts.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PostsService {
  constructor(
    @Inject('DRIZZLE_CORE_MODULE_CONNECTION') private readonly db: any,
  ) {}

  // Pure mapper function isolating DB entity from API response contract
  private toResponseDto(record: PostRecord): PostResponseDto {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      content: record.content,
      status: record.status as any,
      metadata: record.metadata ?? null,
      viewCount: record.viewCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async create(dto: CreatePostDto): Promise<PostResponseDto> {
    // 1. Business Logic Check
    const existing = await this.db
      .select()
      .from(posts)
      .where(eq(posts.slug, dto.slug))
      .get();

    if (existing) {
      throw new ConflictException(`Post with slug '${dto.slug}' already exists.`);
    }

    // 2. Safe mapping from Inbound DTO to Internal Storage Entity
    const inserted = await this.db
      .insert(posts)
      .values({
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        status: dto.status ?? 'DRAFT',
        metadata: dto.metadata ?? null,
        internalAuditFlag: false, // Explicitly controlled by the system, not the client
      })
      .returning()
      .get();

    return this.toResponseDto(inserted);
  }

  async findBySlug(slug: string): Promise<PostResponseDto> {
    const record = await this.db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .get();

    if (!record) {
      throw new NotFoundException(`Post with slug '${slug}' not found.`);
    }

    return this.toResponseDto(record);
  }
}
```

---

### Step 5.2: The Controller Layer with Full Response Contracts

Update `src/posts/posts.controller.ts`:

```typescript
// src/posts/posts.controller.ts
import { Controller, Post, Get, Body, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';

@ApiTags('Posts Management')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create and publish a new blog post',
    description: 'Validates unique slug constraints, sanitizes markdown content, and persists metadata.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post successfully created and staged.',
    type: PostResponseDto, // Explicitly binds the output contract to Swagger
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Slug collision encountered.',
  })
  async create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
    return this.postsService.create(createPostDto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Retrieve an article by unique URL slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post found and returned.',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post does not exist.',
  })
  async findOne(@Param('slug') slug: string): Promise<PostResponseDto> {
    return this.postsService.findBySlug(slug);
  }
}
```

---

## 6. Verification & Inspection

1. Clean the build folder and restart your development server:
   ```bash
   npm run start:dev
   ```

2. Open `http://localhost:3000/docs`:
   * **Inspect Request Body Schema:**  
     Check `POST /api/v1/posts`. Notice the nested `metadata` property with its own inner schema (`seoDescription`, `canonicalUrl`) fully populated with examples and types.
   * **Inspect Response Schema:**  
     Under the `201 Created` status code, verify that `PostResponseDto` is documented with all properties (`id`, `viewCount`, `createdAt`, etc.)—while `internalAuditFlag` is nowhere to be found.
   * **Test Live Validation:**  
     Click **"Try it out"** on `POST /api/v1/posts`.  
     Try sending an invalid slug like `"Invalid Slug With Spaces!"`.  
     Notice that your global `ValidationPipe` blocks it with a `400 Bad Request` and returns your custom message:  
     `"slug must be a valid URL-safe slug (lowercase letters, numbers, and hyphens only)"`.

---

## Checkpoint

We have established:
* Complete decoupling of database persistence from the external API contract.
* Multi-level DTOs with nested composition (`@ValidateNested()` + `@Type()`).
* Custom business validators (`@IsSlug()`).
* Strict response modeling using `PostResponseDto` to prevent sensitive data leaks.

Let me know once you have verified the nested schema and response contract in your `/docs` UI, and we will proceed to **Module 4: Parameter Ingestion & Gateway Header Contracts**!