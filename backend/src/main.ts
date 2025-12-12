import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // Listen on 0.0.0.0 to accept connections from outside the container
  const port = process.env.PORT ?? 3000;
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy, trying port 3001...`);
      await app.listen(3001, '0.0.0.0');
      console.log(`Application is running on: ${await app.getUrl()}`);
    } else {
      throw err;
    }
  }
}
bootstrap();
