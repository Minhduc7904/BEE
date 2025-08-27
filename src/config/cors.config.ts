import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS configuration for the application
 */
export class CorsConfig {
    /**
     * Get CORS options based on environment
     */
    static getOptions(): CorsOptions {
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
            return this.getDevelopmentOptions();
        } else {
            return this.getProductionOptions();
        }
    }

    /**
     * Development CORS configuration - More permissive
     */
    private static getDevelopmentOptions(): CorsOptions {
        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (Swagger UI, Postman, mobile apps, etc.)
                if (!origin) {
                    return callback(null, true);
                }
                
                const allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'http://localhost:4200', // Angular dev server
                    'http://localhost:8080', // Vue dev server
                    'http://localhost:5173', // Vite dev server
                ];
                
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                } else {
                    return callback(null, true); // Allow all in development
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Key',
                'X-Client-Version',
                'Cache-Control',
                'Pragma',
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Page-Count',
                'X-Current-Page',
            ],
            credentials: true,
            maxAge: 86400, // 24 hours
            preflightContinue: false,
            optionsSuccessStatus: 204,
        };
    }

    /**
     * Production CORS configuration - More restrictive
     */
    private static getProductionOptions(): CorsOptions {
        const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
            ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
            : ['https://yourdomain.com'];

        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, curl, Postman, etc.)
                if (!origin) return callback(null, true);
                
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                } else {
                    return callback(new Error('Not allowed by CORS policy'));
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Page-Count',
                'X-Current-Page',
            ],
            credentials: true,
            maxAge: 86400, // 24 hours
            preflightContinue: false,
            optionsSuccessStatus: 204,
        };
    }

    /**
     * Get CORS options for specific routes (if needed)
     */
    static getCustomOptions(customOrigins?: string[]): CorsOptions {
        return {
            origin: customOrigins || ['*'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
            ],
            credentials: true,
        };
    }
}
