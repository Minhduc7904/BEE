import { NestFactory } from '@nestjs/core'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { CorsConfig } from './config/cors.config'
import { Server } from 'http'

async function bootstrap() {
  dotenv.config()

  const app = await NestFactory.create(AppModule)

  /* =========================
   * CORS
   * ========================= */
  app.enableCors(CorsConfig.getOptions())

  /* =========================
   * Global prefix
   * ========================= */
  app.setGlobalPrefix('api')

  /* =========================
   * Validation
   * ========================= */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  /* =========================
   * Exception filter
   * ========================= */
  app.useGlobalFilters(new HttpExceptionFilter())

  /* =========================
   * HTTP Server timeout config
   * ========================= */
  const server: Server = app.getHttpServer()

  // ⏱ Request timeout (quan trọng)
  server.timeout = Number(process.env.SERVER_TIMEOUT_MS ?? 120_000) // 120s

  // ⏱ Header timeout (phải > timeout)
  server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS ?? 130_000)

  // ⏱ Keep alive
  server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS ?? 65_000)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  console.log('🧠 Server timeout config:')
  console.log(' - timeout:', server.timeout)
  console.log(' - headersTimeout:', server.headersTimeout)
  console.log(' - keepAliveTimeout:', server.keepAliveTimeout)
  console.log(`🚀 Server running on http://localhost:${port}`)
}

bootstrap()
