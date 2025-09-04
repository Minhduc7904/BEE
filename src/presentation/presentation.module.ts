// src/presentation/presentation.module.ts
import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { AuthController } from './controllers/auth.controller';
import { ResourceController } from './controllers/resource.controller';

@Module({
    imports: [ApplicationModule],
    controllers: [AuthController, ResourceController],
})
export class PresentationModule { }
