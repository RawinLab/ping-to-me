import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });

  // Increase body size limit for logo uploads (base64 encoded images)
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3010',
    ],
    credentials: true,
  });
  app.use(cookieParser());

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('PingToMe API')
    .setDescription('The PingToMe URL Shortener and Link Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addTag('auth', 'Authentication endpoints')
    .addTag('links', 'Link management')
    .addTag('domains', 'Custom domain management')
    .addTag('analytics', 'Analytics and tracking')
    .addTag('bio-pages', 'Bio page management')
    .addTag('organizations', 'Organization management')
    .addTag('payments', 'Subscription and billing')
    .addTag('developer', 'API keys and webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();

