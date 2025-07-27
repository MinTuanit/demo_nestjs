import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.setGlobalPrefix('api/v1', { exclude: [''] });
  app.enableCors({
    "origin": true,
    "methods": 'GET,HEAD,PUT,PATCH,POST,DELETE',
    "preflightContinue": false,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
