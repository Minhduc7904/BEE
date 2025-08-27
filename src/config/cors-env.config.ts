import { registerAs } from '@nestjs/config';

export default registerAs('cors', () => ({
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [],
    allowCredentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'),
    methods: process.env.CORS_ALLOWED_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
    ],
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS?.split(',') || [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
    ],
}));
