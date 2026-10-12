import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/swagger/swagger.setup';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');

  app.setGlobalPrefix(apiPrefix);

  // enterprise best practices: API uri versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  // validation and sanitization pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  // Swagger setup
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`App running on ${await app.getUrl()}`)
}
void bootstrap();
