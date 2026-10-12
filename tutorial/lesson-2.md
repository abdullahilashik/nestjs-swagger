# Module 2: Compiler-Level Metaprogramming & AST Plugins

In typical beginner tutorials, every DTO is cluttered with repetitive decorators:

```typescript
// ❌ THE JUNIOR ANTI-PATTERN: Decorator Clutter & Duplication
@ApiProperty({ description: 'The title of the post', type: String, required: true, minLength: 5 })
@IsString()
@IsNotEmpty()
@MinLength(5)
title: string;
```

On an enterprise team maintaining hundreds of DTOs, this manual approach causes:
1. **Schema Drift:** A developer updates `@MinLength(10)` in `class-validator` but forgets `@ApiProperty({ minLength: 5 })`. The documentation is now lying to your frontend and API consumers.
2. **Codebase Bloat:** Your data models become 70% documentation annotations and 30% actual code.

We solve this using **TypeScript Abstract Syntax Tree (AST) compilation**. The NestJS Swagger plugin hooks into the TypeScript compiler (`tsc`) during build time, analyzes the types and JSDoc comments, and automatically generates OpenAPI metadata behind the scenes.

---

## 1. How the AST Plugin Works Under the Hood

When you execute `nest build` or `nest start --watch`, the `@nestjs/swagger` compiler plugin intercepts the TypeScript AST:

```
[ Your TypeScript Code ] 
         ↓
  (TypeScript AST)
         ↓
[@nestjs/swagger/plugin] 
  ├── Reads: title: string;               ──→ Generates: { type: 'string' }
  ├── Reads: /** The title of the post */ ──→ Generates: { description: 'The title of the post' }
  ├── Reads: @IsOptional()                ──→ Generates: { required: false }
  └── Reads: @MinLength(5)                ──→ Generates: { minLength: 5 }
         ↓
[ Compiled JavaScript with hidden OpenAPI static metadata ]
```

---

## 2. Enterprise Configuration: `nest-cli.json`

Open the `nest-cli.json` file in the root of your `nestjs-swagger` project. Replace or augment the `compilerOptions` section with the configuration below:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli.json",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "dtoFileNameSuffix": [".dto.ts", ".entity.ts"],
          "controllerFileNameSuffix": [".controller.ts"],
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

### Breakdown of These Enterprise Flags:

* **`introspectComments: true`**: Extracts standard JSDoc comments (`/** ... */`) and maps them directly to OpenAPI `description`, `example`, and `default` metadata without needing `@ApiProperty({ description: ... })`.
* **`classValidatorShim: true`**: Automatically maps `class-validator` rules to OpenAPI schema constraints:
  * `@IsOptional()` marks the property as `required: false`.
  * `@Min(x)` / `@Max(y)` sets `minimum: x` and `maximum: y`.
  * `@MinLength(x)` / `@MaxLength(y)` sets `minLength: x` and `maxLength: y`.
  * `@IsPositive()` sets `minimum: 1`.
  * `@IsIn(['A', 'B'])` generates an enum schema.
* **`dtoFileNameSuffix` & `controllerFileNameSuffix`**: Restricts the AST analyzer only to files following strict enterprise naming conventions. This prevents compilation slowdowns by ignoring services, repositories, modules, and utilities.

---

## 3. Hands-On Test: Zero-Decorator DTO in `PostsModule`

Since your `AppModule` already imports `PostsModule`, let's verify this automation directly inside your codebase.

### Step 3.1: Install Validation Dependencies
Ensure `class-validator` and `class-transformer` are installed:

```bash
npm install class-validator class-transformer
```

---

### Step 3.2: Create `CreatePostDto`
Create `src/posts/dto/create-post.dto.ts` with **zero** `@ApiProperty` decorators:

```typescript
// src/posts/dto/create-post.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreatePostDto {
  /**
   * The primary title of the blog post
   * @example "How to Scale NestJS in Enterprise Environments"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  /**
   * Full markdown content of the article
   * @example "# Introduction\nHere is how we scale..."
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
   * List of search tags categorized for this post
   * @example ["nodejs", "architecture", "drizzle"]
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
```

Notice:
1. No `@ApiProperty()`.
2. No `@ApiPropertyOptional()`.
3. Validation rules are declared once.
4. Descriptions and examples are standard TypeScript JSDoc comments.

---

### Step 3.3: Hook into `PostsController`
Make sure your `src/posts/posts.controller.ts` accepts this DTO:

```typescript
// src/posts/posts.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('Posts Management')
@Controller('posts')
export class PostsController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and publish a new post' })
  async create(@Body() createPostDto: CreatePostDto) {
    return {
      id: 1,
      ...createPostDto,
      createdAt: new Date().toISOString(),
    };
  }
}
```

---

## 4. Crucial Enterprise Gotcha: Cleaning the Build Cache

The NestJS CLI caches compiled files in `dist/`. When you update `nest-cli.json` to activate a compiler plugin, the cache can sometimes serve older builds that lack the injected AST metadata.

Whenever you change `nest-cli.json`, delete the build artifact folder before restarting:

```bash
# On Windows (PowerShell):
Remove-Item -Recurse -Force dist

# On Linux/macOS:
rm -rf dist
```

Now start the development server:
```bash
npm run start:dev
```

---

## 5. Inspecting the Output

1. Open your browser to `http://localhost:3000/docs`.
2. Locate the **Posts Management** tag and expand `POST /api/v1/posts`.
3. Inspect the **Request body** and the generated schema:
   * **`title`**: String, required, with red asterisk, `minLength: 5`, `maxLength: 120`, description populated from JSDoc, example populated from `@example`.
   * **`content`**: String, required, description populated.
   * **`status`**: String enum dropdown (`DRAFT`, `PUBLISHED`, `ARCHIVED`), marked optional, default set to `"DRAFT"`.
   * **`tags`**: Array of strings, marked optional, example pre-filled.
4. Click **"Try it out"**: The editable text area is pre-filled with the `@example` values we provided in JSDoc!

---

## 6. The Boundaries: What the AST Plugin Cannot Do

While the plugin automates ~85% of your documentation, an enterprise engineer must know when it reaches its limits. You still need explicit decorators in these situations:

| Scenario | Plugin Behavior | Required Explicit Decorator |
| :--- | :--- | :--- |
| **Generics** (`Paginated<T>`) | Erased at runtime; cannot infer `T` | `@ApiExtraModels()`, dynamic schema resolver (Module 6) |
| **Polymorphic / Union Types** (`Cat \| Dog`) | Collapses into an ambiguous object | `@ApiProperty({ oneOf: [...] })` (Module 6) |
| **Circular References** | Causes infinite recursion or `{}` | `@ApiProperty({ type: () => OtherDto })` (Module 6) |
| **Binary File Uploads** | Sees `Express.Multer.File` as generic object | `@ApiProperty({ type: 'string', format: 'binary' })` (Module 8) |

---

## Verification Checkpoint

Check your `/docs` UI. Does `POST /api/v1/posts` render the full schema, types, examples, and descriptions without a single `@ApiProperty()` in `CreatePostDto`?

Once confirmed, we will advance to **Module 3: Contract Modeling — DTOs, Validation & Database Isolation**, where we integrate this with Drizzle ORM schemas while keeping database layers strictly decoupled from external contracts.