import { registerAs } from '@nestjs/config'

export default registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'Bee API',
  description: process.env.SWAGGER_DESCRIPTION || 'NestJS + Prisma + Swagger API Documentation',
  version: process.env.SWAGGER_VERSION || '1.0.0',
  path: process.env.SWAGGER_PATH || 'docs',
  enabled: process.env.SWAGGER_ENABLED !== 'false', // Default true, set to 'false' to disable
  servers: {
    development: process.env.SWAGGER_DEV_SERVER || 'http://localhost:3000',
    production: process.env.SWAGGER_PROD_SERVER || 'https://api.yourapp.com',
  },
  auth: {
    bearerFormat: 'JWT',
    scheme: 'bearer',
    type: 'http',
  },
}))
