import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as express from 'express';

const envPath = join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // Listen on 0.0.0.0 to accept connections from outside the container
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
