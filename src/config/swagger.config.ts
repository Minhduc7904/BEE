import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Cấu hình Swagger documentation
 */
export class SwaggerConfig {
    /**
     * Thiết lập Swagger cho ứng dụng
     */
    static setup(app: INestApplication): void {
        const port = process.env.PORT || 3000;
        const config = new DocumentBuilder()
            .setTitle('Bee API')
            .setDescription('NestJS + Prisma + Swagger API Documentation')
            .setVersion('1.0.0-beta.1')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
            )
            .addServer(`http://localhost:${port}`, 'Development server')
            .addServer('https://api.yourapp.com', 'Production server')
            .build();

        const document = SwaggerModule.createDocument(app, config);

        SwaggerModule.setup('docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'none',
                filter: true,
                showRequestDuration: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                tryItOutEnabled: true,
                requestInterceptor: (req: any) => {
                    // Ensure proper headers for CORS
                    req.headers['Content-Type'] = 'application/json';
                    return req;
                },
            },
            customSiteTitle: 'Bee API Documentation',
            explorer: true,
        });
    }

    /**
     * Cấu hình cho môi trường production
     */
    static setupForProduction(app: INestApplication): void {
        // Trong production có thể disable Swagger hoặc yêu cầu authentication
        if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SWAGGER) {
            return;
        }

        this.setup(app);
    }
}
