import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // bật validation toàn cục (khuyên dùng)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Bee API')
    .setDescription('NestJS + Prisma + Swagger API docs')
    .setVersion('1.0')
    .addBearerAuth() // nếu sau này bạn có auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log('  Prisma studio running: http://localhost:5555');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📖 Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
