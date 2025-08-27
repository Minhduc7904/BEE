import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { SwaggerConfig } from './config/swagger.config';
import { CorsConfig } from './config/cors.config';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // Thiết lập CORS
  app.enableCors(CorsConfig.getOptions());

  // Thiết lập global prefix cho tất cả routes
  app.setGlobalPrefix('api');

  // bật validation toàn cục (khuyên dùng)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // bật exception filter toàn cục
  app.useGlobalFilters(new HttpExceptionFilter());

  // Thiết lập Swagger documentation
  SwaggerConfig.setup(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log('  Prisma studio running: http://localhost:5555');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📖 Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
