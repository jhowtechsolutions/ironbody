import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';
import { resolveCorsConfig } from './config/cors';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const expressApp = app.getHttpAdapter().getInstance();
  // Stripe webhook precisa do body raw para validar a assinatura
  expressApp.use('/v1/stripe/webhook', express.raw({ type: 'application/json' }));
  expressApp.use(express.json());

  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors(resolveCorsConfig());

  const config = new DocumentBuilder()
    .setTitle('IronBody API')
    .setDescription('API do ecossistema fitness IronBody - Personal e Aluno')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  const publicBase =
    process.env.APP_URL_API || `http://localhost:${port}`;
  console.log(`IronBody API · NODE_ENV=${process.env.NODE_ENV ?? 'undefined'}`);
  console.log(`Base: ${publicBase}/v1 · Health: ${publicBase}/v1/health · Ready: ${publicBase}/v1/health/ready`);
  console.log(`Swagger: ${publicBase}/v1/docs`);
}
bootstrap();
