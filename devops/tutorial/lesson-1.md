# Module 1: Enterprise Architectural Foundations & Lifecycle Setup

In an enterprise codebase, `main.ts` is strictly an orchestration entrypoint—it should not contain 80 lines of Swagger configuration. 

Putting Swagger logic inline inside `main.ts` violates the **Single Responsibility Principle**, bloats application bootstrapping, and makes it impossible to reuse the configuration for **headless schema extraction in CI/CD pipelines** (which we will build in Module 13).

In this module, we will establish an isolated, environment-aware Swagger subsystem built around `@nestjs/config`.

---

## 1. Engine Analysis: Express vs. Fastify

Before installing dependencies, let's look at the runtime trade-offs between the two HTTP adapters:

| Architectural Metric | Express (`swagger-ui-express`) | Fastify (`@fastify/swagger` + `@fastify/swagger-ui`) |
| :--- | :--- | :--- |
| **Default in NestJS** | Yes | No (requires `@nestjs/platform-fastify`) |
| **Throughput / Latency** | Baseline Node.js performance | Up to ~2x higher raw throughput |
| **Schema Generation** | At runtime via dynamic middleware | Native JSON Schema integration |
| **Ecosystem Maturity** | Ubiquitous plugin compatibility | Faster, but requires Fastify-specific plugins |

> **Enterprise Rule of Thumb:** If your service is a high-frequency I/O proxy or gateway handling tens of thousands of requests per second, choose **Fastify**. If your application relies on the broader Node.js ecosystem (standard Multer middleware, standard auth libraries, etc.), choose **Express**. 
>
> We will proceed with the **Express** standard (`swagger-ui-express`), which matches the default NestJS platform setup.

---

## 2. Dependency Installation

Run the following command inside your `nestjs-swagger` project root:

```bash
npm install @nestjs/swagger swagger-ui-express
```

---

## 3. Environment Contract Configuration

A Swagger UI should **never leak into public production environments by accident**. It exposes internal API topologies, payload structures, and attack surfaces. 

We must bind Swagger activation to our environment configuration using `@nestjs/config`.

### Define Environment Variables
Open or create your `.env` and `.env.example` files:

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME="Enterprise Core API"
APP_URL=http://localhost:3000

# API Versioning & Ingress
API_PREFIX=api

# Swagger Controls
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
SWAGGER_PERSIST_AUTH=true
```

---

## 4. Building the Dedicated Swagger Module

Create a dedicated directory for documentation orchestration:

```
src/
└── common/
    └── swagger/
        ├── swagger.interface.ts
        └── swagger.setup.ts
```

### Step 4.1: The Configuration Interface
Define a strict contract for your documentation parameters to prevent runtime `undefined` configuration errors.

```typescript
// src/common/swagger/swagger.interface.ts

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
  enabled: boolean;
  persistAuthorization: boolean;
  servers: Array<{
    url: string;
    description: string;
  }>;
}
```

---

### Step 4.2: The Isolated Bootstrap Factory (`swagger.setup.ts`)

This factory handles all document assembly, multi-region server mapping, and UI ergonomics.

```typescript
// src/common/swagger/swagger.setup.ts

import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('SwaggerSetup');

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  // 1. Ingress Gate: Check if documentation is enabled in this environment
  const isEnabled = configService.get<string>('SWAGGER_ENABLED', 'false') === 'true' 
    || configService.get<boolean>('SWAGGER_ENABLED', false) === true;

  if (!isEnabled) {
    logger.log('Swagger documentation is disabled for this runtime environment.');
    return;
  }

  // 2. Read Configuration Values
  const appName = configService.get<string>('APP_NAME', 'Enterprise Core API');
  const appUrl = configService.get<string>('APP_URL', 'http://localhost:3000');
  const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const persistAuth = configService.get<string>('SWAGGER_PERSIST_AUTH', 'true') === 'true';

  // 3. Document Builder Setup (RFC Compliance, Contact, Topology)
  const documentBuilder = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      `Enterprise REST API Engine - Single Source of Truth Contract.\n\n` +
      `**Environment:** \`${nodeEnv}\`\n` +
      `**Specification Standard:** OpenAPI 3.0 / 3.1 compatible.`
    )
    .setVersion('1.0.0')
    .setContact(
      'Platform Architecture Team',
      'https://company.internal',
      'api-support@company.internal'
    )
    .setLicense('Proprietary / Enterprise Closed Source', 'https://company.internal/terms')
    
    // Topology: Support Local Dev, Staging, and Production Gateway proxies
    .addServer(appUrl, 'Current Deployment Context')
    .addServer('https://staging-api.company.internal', 'Staging Integration Cluster')
    .addServer('https://api.company.internal', 'Production Primary Gateway')

    // Initial Global Security Definitions (Detailed in Module 7)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Provide an RFC 6750 JWT Bearer token.',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Enterprise Machine-to-Machine Secret Access Key.',
      },
      'Api-Key',
    );

  const documentConfig = documentBuilder.build();

  // 4. Generate the OpenAPI Document AST
  const document = SwaggerModule.createDocument(app, documentConfig, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      // Produces clean operation names in generated SDK clients (e.g., 'UsersController_findAll' -> 'findAll')
      return methodKey;
    },
  });

  // 5. UI Ergonomics & Developer Portal Settings
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: persistAuth, // Retains auth tokens in LocalStorage across page reloads
      displayRequestDuration: true,     // Shows latency metrics for every executed request (ms)
      filter: true,                     // Enables real-time endpoint search filter bar
      docExpansion: 'none',             // Keeps all tags collapsed on initial load (prevents browser lag on 100+ endpoints)
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,            // Automatically opens the "Try it out" form by default
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customSiteTitle: `${appName} | Interactive API Portal`,
  };

  // 6. Mount Swagger UI & Raw JSON/YAML endpoints
  SwaggerModule.setup(swaggerPath, app, document, customOptions);

  logger.log(`OpenAPI Portal mounted at: ${appUrl}/${swaggerPath}`);
  logger.log(`Raw OpenAPI JSON spec accessible at: ${appUrl}/${swaggerPath}-json`);
  logger.log(`Raw OpenAPI YAML spec accessible at: ${appUrl}/${swaggerPath}-yaml`);
}
```

---

## 5. Wiring into `src/main.ts`

Now, keep your bootstrap file clean and focused on infrastructure concerns:

```typescript
// src/main.ts

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger/swagger.setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');

  // Enterprise Best Practice: Global Prefix for all REST operations
  app.setGlobalPrefix(apiPrefix);

  // Enterprise Best Practice: API URI Versioning (/api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Strict Request Body Validation & Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Mount our modular Swagger subsystem
  setupSwagger(app);

  await app.listen(port);
  logger.log(`Application running on: ${await app.getUrl()}`);
}

bootstrap();
```

---

## 6. Verification Checklist

Run your development server:

```bash
npm run start:dev
```

Inspect your terminal output and confirm the following:
1. `SwaggerSetup` logs the initialization path: `http://localhost:3000/docs`.
2. Navigate to `http://localhost:3000/docs` in your browser:
   * Verify the **Title**, **Description**, **Terms**, and **Contact Email**.
   * Verify the **Servers** dropdown (Local, Staging, Production).
   * Verify the top **Search Bar** works.
   * Verify the green **Authorize** button appears with options for both `JWT-auth` and `Api-Key`.
3. Navigate to `http://localhost:3000/docs-json`:
   * Confirm the raw OpenAPI 3.0 specification JSON is returned.
4. Navigate to `http://localhost:3000/docs-yaml`:
   * Confirm the raw YAML specification is returned.
5. In your `.env`, toggle `SWAGGER_ENABLED=false` and restart:
   * Confirm that visiting `/docs` returns a 404 and that no Swagger logic runs in memory. Set it back to `true`.

---

## Checkpoint

We now have an isolated, environment-gated Swagger architecture with complete UI ergonomics, multi-cluster servers, and raw schema emission.

Let me know once your server boots and you can access the `/docs` UI. We will then move straight into **Module 2: Compiler-Level Metaprogramming & AST Plugins** to eliminate manual `@ApiProperty()` annotations across your codebase.