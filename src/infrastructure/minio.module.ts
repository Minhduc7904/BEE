import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MinioService } from './services/minio.service'
import { MinioConfig } from '../config/minio.config'
import { MinioService as MinioServicePort } from 'src/application/interfaces'

@Global()
@Module({
  imports: [ConfigModule.forFeature(MinioConfig)],
  providers: [MinioService, { provide: MinioServicePort, useExisting: MinioService }],
  exports: [MinioService, MinioServicePort],
})
export class MinioModule {}
