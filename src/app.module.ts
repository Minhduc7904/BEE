import { Module } from '@nestjs/common';
import { PresentationModule } from './presentation/presentation.module';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    PrismaModule,
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
    ConfigModule.forRoot({
      isGlobal: true, // dùng global để inject ở mọi nơi
      load: [jwtConfig],
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn'),
          issuer: config.get<string>('jwt.issuer'),
          audience: config.get<string>('jwt.audienceApi'),
        },
      }),
    }),
  ],
})
export class AppModule { }
