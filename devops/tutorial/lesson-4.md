# Module 4: Parameter Ingestion & Gateway Header Contracts

In RESTful enterprise systems, data enters your system through four distinct network channels defined by RFC 7230 / OpenAPI specs:

1. **Path (`in: "path"`):** Resource identification (e.g., `/posts/:id`).
2. **Query (`in: "query"`):** Filtering, sorting, searching, and pagination (e.g., `?page=1&limit=20`).
3. **Header (`in: "header"`):** Metadata, security tokens, distributed tracing, and tenancy (e.g., `x-correlation-id`).
4. **Body (`in: "body"`):** State mutation payloads (covered in Module 3).

In this module, we will implement parameter parsing, query filtering, and gateway headers while ensuring Swagger UI renders interactive controls for them (dropdowns, number steppers, and tracing headers).

---

## 1. Path Parameters & Strict Coercion

### The Junior Anti-Pattern
```typescript
// ❌ UNVALIDATED STRING ID
@Get(':id')
findOne(@Param('id') id: string) { ... }
```
This accepts `"abc"`, `"-5"`, or raw SQL injection payloads into your database query.

### The Enterprise Standard: Pipes + OpenAPI Reflection
When you bind NestJS validation pipes (like `ParseIntPipe` or `ParseUUIDPipe`), the Swagger AST plugin inspects the pipe type and sets the schema format in OpenAPI automatically.

However, for **custom descriptions**, **regex-constrained slugs**, or **example IDs**, you use `@ApiParam()` to enrich the contract:

```typescript
@Get(':id')
@ApiOperation({ summary: 'Retrieve post by internal numerical ID' })
@ApiParam({
  name: 'id',
  type: Number,
  description: 'Auto-incrementing database primary key',
  example: 42,
})
async findOneById(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) 
  id: number
) { ... }
```

---

## 2. Query Parameters: The Filter DTO Pattern

### Why inline `@Query()` decorators fail at scale
```typescript
// ❌ CLUTTERED & UNMAINTAINABLE IN CONTROLLERS
@Get()
findAll(
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('search') search: string,
  @Query('status') status: PostStatus,
  @Query('sortBy') sortBy: string,
)
```
Writing queries inline scatters validation, prevents reusable contracts across endpoints, and confuses the compiler plugin.

### The Solution: Dedicated Query DTO
Create a structured query object. Notice how `class-validator`, `class-transformer`, and JSDoc work together to generate UI dropdowns and numerical constraints.

Create `src/posts/dto/find-posts-query.dto.ts`:

```typescript
// src/posts/dto/find-posts-query.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from './create-post.dto';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  VIEW_COUNT = 'viewCount',
  TITLE = 'title',
}

export class FindPostsQueryDto {
  /**
   * Page number for pagination
   * @default 1
   * @example 1
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  /**
   * Number of records returned per page
   * @default 10
   * @example 10
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  /**
   * Substring search across title and content
   * @example "architecture"
   */
  @IsString()
  @IsOptional()
  search?: string;

  /**
   * Filter records by publication lifecycle status
   */
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  /**
   * Target field to sort against
   * @default "createdAt"
   */
  @IsEnum(PostSortBy)
  @IsOptional()
  sortBy: PostSortBy = PostSortBy.CREATED_AT;

  /**
   * Ordering direction
   * @default "desc"
   */
  @IsEnum(SortDirection)
  @IsOptional()
  sortOrder: SortDirection = SortDirection.DESC;
}
```

#### What happens in Swagger UI:
* **`page` & `limit`**: The UI displays number input fields with min/max validation rules.
* **`status`, `sortBy`, `sortOrder`**: The UI generates **interactive dropdown menus** containing only the allowed enum choices.
* **`@Type(() => Number)`**: Resolves the HTTP query string parsing problem (query params arrive as strings `"10"`; `class-transformer` converts them to real numbers before validation).

---

## 3. Observability & Distributed Tracing Headers

In enterprise architectures, microservices run behind API Gateways (e.g., Kong, Envoy, AWS API Gateway). 

Every inbound request must carry distributed tracing headers so you can trace a transaction through logs across multiple backend services.

### Step 3.1: Define Common Tracing Headers
Create `src/common/constants/headers.constants.ts`:

```typescript
// src/common/constants/headers.constants.ts
export const TRACE_HEADERS = {
  CORRELATION_ID: 'x-correlation-id',
  REQUEST_ID: 'x-request-id',
} as const;
```

---

### Step 3.2: Create an Enterprise Tracing Decorator
Instead of manually typing `@ApiHeader(...)` and `@Headers('x-correlation-id')` on every endpoint, compose them into a reusable decorator:

Create `src/common/decorators/correlation-id.decorator.ts`:

```typescript
// src/common/decorators/correlation-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TRACE_HEADERS } from '../constants/headers.constants';

export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers[TRACE_HEADERS.CORRELATION_ID] as string | undefined;
  },
);
```

---

## 4. Hooking Parameters into Service & Controller

Let's wire this up to Drizzle and test the endpoint.

### Step 4.1: Update `PostsService` to Handle Filters and Pagination
Update `src/posts/posts.service.ts`:

```typescript
// src/posts/posts.service.ts
// Add these imports at the top:
import { FindPostsQueryDto, PostSortBy, SortDirection } from './dto/find-posts-query.dto';
import { desc, asc, like, and, count } from 'drizzle-orm';

// Add these methods inside PostsService:

  async findOneById(id: number): Promise<PostResponseDto> {
    const record = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .get();

    if (!record) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    return this.toResponseDto(record);
  }

  async findAll(query: FindPostsQueryDto) {
    const offset = (query.page - 1) * query.limit;

    // Build conditions array
    const conditions = [];

    if (query.status) {
      conditions.push(eq(posts.status, query.status));
    }

    if (query.search) {
      conditions.push(like(posts.title, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting expression
    const sortField = query.sortBy === PostSortBy.VIEW_COUNT 
      ? posts.viewCount 
      : query.sortBy === PostSortBy.TITLE 
      ? posts.title 
      : posts.createdAt;

    const orderExpr = query.sortOrder === SortDirection.ASC 
      ? asc(sortField) 
      : desc(sortField);

    // Query records
    const records = await this.db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(query.limit)
      .offset(offset)
      .all();

    // Query total count
    const totalCountResult = await this.db
      .select({ count: count() })
      .from(posts)
      .where(whereClause)
      .get();

    const total = totalCountResult?.count ?? 0;

    return {
      items: records.map((record: PostRecord) => this.toResponseDto(record)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
```

---

### Step 4.2: Update `PostsController` with Full Parameter Contracts

Update `src/posts/posts.controller.ts`:

```typescript
// src/posts/posts.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  ParseIntPipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiHeader 
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { FindPostsQueryDto } from './dto/find-posts-query.dto';
import { CorrelationId } from '../common/decorators/correlation-id.decorator';
import { TRACE_HEADERS } from '../common/constants/headers.constants';

@ApiTags('Posts Management')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: 'Filter and paginate posts catalog',
    description: 'Supports full-text title search, publication status filters, and multi-field sorting.',
  })
  @ApiHeader({
    name: TRACE_HEADERS.CORRELATION_ID,
    description: 'Unique trace identifier propagated across microservice boundaries',
    required: false,
    example: 'c9f8a37b-12d4-4c6e-8e31-92b58ef091a1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated collection of posts matching search criteria.',
  })
  async findAll(
    @Query() query: FindPostsQueryDto,
    @CorrelationId() correlationId?: string,
  ) {
    // If tracing ID was provided, you would bind it to your logger context here
    return this.postsService.findAll(query);
  }

  @Get('by-id/:id')
  @ApiOperation({ summary: 'Retrieve an article by numerical primary key' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Auto-incrementing integer ID',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post found and returned.',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post with the requested ID does not exist.',
  })
  async findOneById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) 
    id: number,
  ): Promise<PostResponseDto> {
    return this.postsService.findOneById(id);
  }

  // (Retain existing create and findOne by slug methods...)
```

---

## 5. Verification & Swagger UI Testing

1. Restart your development server:
   ```bash
   npm run start:dev
   ```

2. Open `http://localhost:3000/docs`:
3. Locate `GET /api/v1/posts`:
   * **Parameters Inspection:**
     * **`x-correlation-id`** appears under the **Parameters** section with a dedicated header input box and the example UUID.
     * **`page`** & **`limit`** appear with default values (`1` and `10`) and minimum bound hints.
     * **`status`**, **`sortBy`**, and **`sortOrder`** appear as **interactive dropdown selectors** (click them to choose between `DRAFT`, `PUBLISHED`, `createdAt`, `asc`, `desc`).
     * **`search`** appears as a text input box.
4. Click **"Try it out"**:
   * Set `status` to `DRAFT`.
   * Type `"test-trace-id-1234"` into `x-correlation-id`.
   * Click **Execute**.
   * Inspect the generated Curl command in the UI:
     ```bash
     curl -X 'GET' \
       'http://localhost:3000/api/v1/posts?page=1&limit=10&status=DRAFT&sortBy=createdAt&sortOrder=desc' \
       -H 'accept: application/json' \
       -H 'x-correlation-id: test-trace-id-1234'
     ```
5. Locate `GET /api/v1/posts/by-id/{id}`:
   * Try entering letters like `"abc"` into the `id` field and click Execute.
   * Notice that `ParseIntPipe` immediately blocks the request with a **400 Bad Request** (`"Validation failed (numeric string is expected)"`) before any database code executes.

---

## Checkpoint

You now have a clean system for handling:
* Inbound query DTOs with AST auto-inference.
* Interactive dropdowns generated directly from TypeScript enums.
* Ingress gateway headers (`x-correlation-id`) documented for client SDKs.
* Strong type coercion and validation on path parameters (`ParseIntPipe`).

Let me know when you've tested the filters and headers in the UI, and we will proceed to **Module 5: Standardized Envelopes & Error Contracts (RFC 7807 / 9457)** to eliminate random error formats across your application.