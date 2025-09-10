// src/config/http-client.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('httpClient', () => ({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
  timeout: parseInt(process.env.HTTP_TIMEOUT || '10000', 10),
  bearerToken: process.env.BEARER_TOKEN,
  maxRetries: parseInt(process.env.HTTP_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.HTTP_RETRY_DELAY || '1000', 10),
}));
