import { Module } from '@nestjs/common'

import * as chapterUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const CHAPTER_USE_CASES = [
  chapterUseCase.CreateChapterUseCase,
  chapterUseCase.GetChapterUseCase,
  chapterUseCase.GetAllChaptersUseCase,
  chapterUseCase.GetChapterChildrenUseCase,
  chapterUseCase.GetRootChaptersUseCase,
  chapterUseCase.UpdateChapterUseCase,
  chapterUseCase.DeleteChapterUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: CHAPTER_USE_CASES,
  exports: CHAPTER_USE_CASES,
})
export class ChapterApplicationModule {}
