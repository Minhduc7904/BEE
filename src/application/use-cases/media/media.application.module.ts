import { Module } from '@nestjs/common'

import * as mediaUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const MEDIA_USE_CASES = [
  mediaUseCase.UploadMediaUseCase,
  mediaUseCase.GetMediaUseCase,
  mediaUseCase.GetMediaListUseCase,
  mediaUseCase.GetBucketsListUseCase,
  mediaUseCase.UpdateMediaUseCase,
  mediaUseCase.DeleteMediaUseCase,
  mediaUseCase.GetMediaDownloadUrlUseCase,
  mediaUseCase.GetMediaViewUrlUseCase,
  mediaUseCase.GetBatchMyMediaViewUrlUseCase,
  mediaUseCase.GetMyMediaViewUrlUseCase,
  mediaUseCase.GetMyMediaDownloadUrlUseCase,
  mediaUseCase.CreatePresignedUploadUseCase,
  mediaUseCase.CompletePresignedUploadUseCase,
  mediaUseCase.GetBucketStatisticsUseCase,
  mediaUseCase.GetAdminMediaViewUrlUseCase,
  mediaUseCase.GetAdminMediaDownloadUrlUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: MEDIA_USE_CASES,
  exports: MEDIA_USE_CASES,
})
export class MediaApplicationModule {}
