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
        const config = new DocumentBuilder()
            .setTitle('Bee API')
            .setDescription('NestJS + Prisma + Swagger API Documentation')
            .setVersion('1.0.0')
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
            .addServer('http://localhost:3000', 'Development server')
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
            },
            customSiteTitle: 'Bee API Documentation',
            customfavIcon: '/favicon.ico',
            customJs: [
                'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
            ],
            customCssUrl: [
                'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
            ],
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
