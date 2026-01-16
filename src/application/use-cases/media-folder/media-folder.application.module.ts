import { Module } from '@nestjs/common'

import * as mediaFolderUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const MEDIA_FOLDER_USE_CASES = [
  mediaFolderUseCase.CreateMediaFolderUseCase,
  mediaFolderUseCase.GetMediaFolderUseCase,
  mediaFolderUseCase.GetMediaFolderListUseCase,
  mediaFolderUseCase.GetFolderChildrenUseCase,
  mediaFolderUseCase.UpdateMediaFolderUseCase,
  mediaFolderUseCase.DeleteMediaFolderUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: MEDIA_FOLDER_USE_CASES,
  exports: MEDIA_FOLDER_USE_CASES,
})
export class MediaFolderApplicationModule {}
