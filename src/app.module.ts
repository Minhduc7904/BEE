import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { PresentationModule } from './presentation/presentation.module'
import { ApplicationModule } from './application/application.module'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { PrismaModule } from './prisma/prisma.module'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google' }),
    PrismaModule,
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
    ConfigModule.forRoot({
      isGlobal: true, // dùng global để inject ở mọi nơi
    }),
  ],
})
export class AppModule { }
