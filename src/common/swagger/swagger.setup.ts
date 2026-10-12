import {
    INestApplication,
    Logger
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('SwaggerSetup');

export const setupSwagger = (app: INestApplication) : void => {
    const configService = app.get(ConfigService);
    

    // Ingress Gate: Check if documentation is enabled in this environment
    const isEnabled = configService.get<string>('SWAGGER_ENABLED', 'false') == 'true' || 
        configService.get<boolean>('SWAGGER_ENABLED', false) === true;
    if(!isEnabled){
        logger.error('Swagger documentation is disabled in this environment. Skipping setup');
        return;
    }

    // Read configuration values
    const appName = configService.get<string>('APP_NAME', 'Enterprise Core API');
    const appUrl = configService.get<string>('APP_URL', 'http://localhost:3000');
    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const persistAuth = configService.get<string>('SWAGGER_PERSIST_AUTH', 'true') === 'true';

    // Document builder setup
    const documentBuilder = new DocumentBuilder()
        .setTitle(appName)
        .setVersion('1.0.0')
        .setDescription(
            'This is the API documentation for the Enterprise Core API. It provides detailed information about the available endpoints, request/response formats, and authentication methods. Use this documentation to understand how to interact with the API effectively.' + 
            `Second line as description. This API is running in ${nodeEnv} environment.`
        )
        .setLicense('Propietary / Enterprise Closed Source', 'https://www.enterprise.com')
        .addServer(appUrl, 'Current Deployment Context')
        .addServer('http://staging-api.company.internal', 'Staging Deployment Context')
        .addServer('https://api.company.internal', 'Production primary gateway')
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Provide an RFC 6750 JWT Bearer token.',
            in: 'header'
        }, 'JWT-auth')
        .addApiKey({
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'Enterprise machine-to-machine secret access key'
        }, 'Api-key');

    const documentConfig = documentBuilder.build();

    // generate the openapi document ast
    const document = SwaggerModule.createDocument(app, documentConfig, {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey: string, methodKey: string) => {
            return methodKey;
        }
    });

    const customOptions: SwaggerCustomOptions = {
        swaggerOptions: {
            persistAuthorization: persistAuth,
            displayRequestDuration: true,
            filter: true,
            docExpansion: 'none',
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            syntaxHighlight: {
                activate: true,
                theme: 'monokai'
            }
        },
        customSiteTitle: `${appName} | Interactive API Portal`
    };

    SwaggerModule.setup(swaggerPath, app, document, customOptions);

    logger.log(`OpenAPI portal mounted at ${appName}/${swaggerPath}`);
    logger.log(`Raw OpenAPI JSON spec accessible at: ${appUrl}/${swaggerPath}-json`);
    logger.log(`Raw OpenAPI Yaml spec accessible at: ${appUrl}/${swaggerPath}-yaml`);
}