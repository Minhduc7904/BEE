import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MinioService } from './services/minio.service'
import { MinioConfig } from '../config/minio.config'

@Global()
@Module({
  imports: [ConfigModule.forFeature(MinioConfig)],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
