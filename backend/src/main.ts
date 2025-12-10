import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://zapicar.com.br',
      'https://www.zapicar.com.br',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  // Listen on 0.0.0.0 to accept connections from outside the container
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
