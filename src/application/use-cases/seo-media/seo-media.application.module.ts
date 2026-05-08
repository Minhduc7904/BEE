import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as seoMediaUseCases from './'

const SEO_MEDIA_USE_CASES = [
  seoMediaUseCases.CreateSeoMediaSlotUseCase,
  seoMediaUseCases.GetSeoMediaSlotListUseCase,
  seoMediaUseCases.GetSeoMediaSlotByIdUseCase,
  seoMediaUseCases.GetSeoMediaSlotByCodeUseCase,
  seoMediaUseCases.UpdateSeoMediaSlotUseCase,
  seoMediaUseCases.DeleteSeoMediaSlotUseCase,
  seoMediaUseCases.CreateSeoMediaItemUseCase,
  seoMediaUseCases.GetSeoMediaItemsBySlotUseCase,
  seoMediaUseCases.UpdateSeoMediaItemUseCase,
  seoMediaUseCases.DeleteSeoMediaItemUseCase,
  seoMediaUseCases.ReorderSeoMediaItemsUseCase,
  seoMediaUseCases.UploadSeoMediaImageUseCase,
  seoMediaUseCases.GetPublicSeoMediaItemsBySlotCodeUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: SEO_MEDIA_USE_CASES,
  exports: SEO_MEDIA_USE_CASES,
})
export class SeoMediaApplicationModule {}
