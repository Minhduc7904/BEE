import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as documentUseCases from './'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { ProcessContentWithPresignedUrlsUseCase } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

const DOCUMENT_USE_CASES = [
  documentUseCases.CreateDocumentUseCase,
  documentUseCases.GetDocumentsUseCase,
  documentUseCases.GetDocumentByIdUseCase,
  documentUseCases.GetDocumentBySlugUseCase,
  documentUseCases.GetPublicSeoDocumentsByLevelUseCase,
  documentUseCases.GetPublicSeoDocumentsByTagSlugUseCase,
  documentUseCases.GetPublicSeoLatestDocumentsUseCase,
  documentUseCases.GetPublicSeoDocumentBySlugUseCase,
  documentUseCases.GetPublicSeoRelatedDocumentsBySlugUseCase,
  documentUseCases.GetPublicSeoDocumentSitemapUseCase,
  documentUseCases.IncrementPublicDocumentViewCountUseCase,
  documentUseCases.IncrementPublicDocumentDownloadCountUseCase,
  documentUseCases.DownloadPublicDocumentUseCase,
  documentUseCases.UpdateDocumentUseCase,
  documentUseCases.DeleteDocumentUseCase,
  AttachMediaFromContentUseCase,
  ProcessContentWithPresignedUrlsUseCase,
  ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: DOCUMENT_USE_CASES,
  exports: DOCUMENT_USE_CASES,
})
export class DocumentApplicationModule {}
