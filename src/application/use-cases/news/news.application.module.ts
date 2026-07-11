import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as newsUseCases from './'

const NEWS_USE_CASES = [
  newsUseCases.CreateNewsArticleUseCase,
  newsUseCases.UpdateNewsArticleUseCase,
  newsUseCases.DeleteNewsArticleUseCase,
  newsUseCases.GetNewsArticlesUseCase,
  newsUseCases.GetNewsArticleByIdUseCase,
  newsUseCases.IncrementPublicNewsArticleViewCountUseCase,
  newsUseCases.GetPublicSeoNewsArticleBySlugUseCase,
  newsUseCases.GetPublicSeoFeaturedNewsArticlesUseCase,
  newsUseCases.GetPublicSeoLatestNewsArticlesUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: NEWS_USE_CASES,
  exports: NEWS_USE_CASES,
})
export class NewsApplicationModule {}
