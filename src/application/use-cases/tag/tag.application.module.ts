import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as tagUseCases from './'

const TAG_USE_CASES = [
  tagUseCases.CreateTagUseCase,
  tagUseCases.GetTagsUseCase,
  tagUseCases.GetTagByIdUseCase,
  tagUseCases.UpdateTagUseCase,
  tagUseCases.DeleteTagUseCase,
  tagUseCases.SeedDefaultTagsUseCase,
  tagUseCases.SearchPublicSeoTagsUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: TAG_USE_CASES,
  exports: TAG_USE_CASES,
})
export class TagApplicationModule {}
