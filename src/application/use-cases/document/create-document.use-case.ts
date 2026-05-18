import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateDocumentDto, DocumentResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { MediaStatus, MediaType, MediaVisibility } from 'src/shared/enums'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { DocumentContentExtractionService } from 'src/infrastructure/services/document-content-extraction.service'
import { DocumentSeoAiService } from 'src/infrastructure/services/document-seo-ai.service'
import { DocumentThumbnailService } from 'src/infrastructure/services/document-thumbnail.service'
import { DocumentMediaAltTextAiService } from 'src/infrastructure/services/document-media-alt-text-ai.service'
import { generateUniqueDocumentSlug } from './document-slug.util'
import { assertTagIdsExist } from './document-tags.util'
import { extractMediaIdsFromAlt } from 'src/shared/utils'

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly documentThumbnailService: DocumentThumbnailService,
    private readonly documentContentExtractionService: DocumentContentExtractionService,
    private readonly documentSeoAiService: DocumentSeoAiService,
    private readonly documentMediaAltTextAiService: DocumentMediaAltTextAiService,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(
    dto: CreateDocumentDto,
    userId?: number,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    const document = await this.unitOfWork.executeInTransaction(async (repos) => {
      const media = await repos.mediaRepository.findById(dto.mediaId)
      if (!media) {
        throw new NotFoundException(`Khong tim thay media ${dto.mediaId}`)
      }

      if (media.status !== MediaStatus.READY) {
        throw new ConflictException('Media chua san sang de gan vao tai lieu')
      }

      const isPdf = media.mimeType === 'application/pdf' || media.originalFilename.toLowerCase().endsWith('.pdf')
      if (media.type !== MediaType.DOCUMENT || !isPdf) {
        throw new ConflictException('Tai lieu bat buoc phai la file PDF')
      }

      let thumbnailMedia = dto.thumbnailMediaId
        ? await repos.mediaRepository.findById(dto.thumbnailMediaId)
        : null

      if (dto.thumbnailMediaId && !thumbnailMedia) {
        throw new NotFoundException(`Khong tim thay thumbnail media ${dto.thumbnailMediaId}`)
      }

      if (
        thumbnailMedia &&
        (thumbnailMedia.status !== MediaStatus.READY || thumbnailMedia.type !== MediaType.IMAGE)
      ) {
        throw new ConflictException('Thumbnail media khong hop le')
      }

      await assertTagIdsExist(repos, dto.tagIds)
      const slug = await generateUniqueDocumentSlug(dto.title, repos.documentRepository)
      const shouldGenerateContent =
        dto.contentStartPage !== undefined || dto.contentEndPage !== undefined

      if (
        (dto.contentStartPage === undefined && dto.contentEndPage !== undefined) ||
        (dto.contentStartPage !== undefined && dto.contentEndPage === undefined)
      ) {
        throw new ConflictException('Phai truyen day du trang bat dau va trang ket thuc')
      }

      const rawContent = shouldGenerateContent
        ? await this.documentContentExtractionService.extractMarkdownFromPageRange(
            media,
            dto.contentStartPage!,
            dto.contentEndPage!,
          )
        : dto.content

      const normalizedContentResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
        { fieldName: DOCUMENT_MEDIA_FIELDS.CONTENT, content: rawContent },
      ])
      const normalizedContent =
        this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedContentResults,
          DOCUMENT_MEDIA_FIELDS.CONTENT,
        ) || undefined

      const generatedContentImageMedias = normalizedContent
        ? (await repos.mediaRepository.findByIds(Array.from(extractMediaIdsFromAlt(normalizedContent)))).filter(
            (contentMedia) => contentMedia.type === MediaType.IMAGE && contentMedia.parentId === media.mediaId,
          )
        : []

      const generatedAltTexts = await this.documentMediaAltTextAiService.generate({
        title: dto.title,
        content: normalizedContent,
        includeThumbnail: !thumbnailMedia || !thumbnailMedia.alt,
        contentImages: generatedContentImageMedias.map((contentMedia) => ({
          mediaId: contentMedia.mediaId,
          currentAlt: contentMedia.alt,
        })),
      })

      const seoFields =
        !dto.targetKeyword ||
        !dto.keywordText ||
        !dto.metaTitle ||
        !dto.metaDescription ||
        !dto.ogTitle ||
        !dto.ogDescription ||
        !dto.searchIntent
          ? await this.documentSeoAiService.generate({
              title: dto.title,
              content: normalizedContent,
            })
          : null

      const { mediaId, thumbnailMediaId, contentStartPage, contentEndPage, ...createData } = dto

      const document = await repos.documentRepository.create({
        ...createData,
        content: normalizedContent,
        targetKeyword: dto.targetKeyword || seoFields?.targetKeyword,
        keywordText: dto.keywordText || seoFields?.keywordText,
        metaTitle: dto.metaTitle || seoFields?.metaTitle,
        metaDescription: dto.metaDescription || seoFields?.metaDescription,
        ogTitle: dto.ogTitle || seoFields?.ogTitle,
        ogDescription: dto.ogDescription || seoFields?.ogDescription,
        searchIntent: dto.searchIntent || seoFields?.searchIntent,
        slug,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })

      await repos.mediaUsageRepository.attach({
        mediaId,
        entityType: EntityType.DOCUMENT,
        entityId: document.documentId,
        fieldName: DOCUMENT_MEDIA_FIELDS.DOCUMENT_FILE,
        usedBy: userId,
        visibility: MediaVisibility.PUBLIC,
      })

      await this.attachMediaFromContentUseCase.attachMedia(
        normalizedContentResults,
        EntityType.DOCUMENT,
        document.documentId,
        userId!,
        repos.mediaUsageRepository,
      )

      if (!thumbnailMedia) {
        const generatedThumbnail = await this.documentThumbnailService.generateFromPdf(media)
        await this.documentThumbnailService.upload(generatedThumbnail)

        thumbnailMedia = await repos.mediaRepository.create({
          bucketName: generatedThumbnail.bucketName,
          objectKey: generatedThumbnail.objectKey,
          originalFilename: generatedThumbnail.originalFilename,
          mimeType: generatedThumbnail.mimeType,
          fileSize: generatedThumbnail.buffer.length,
          type: MediaType.IMAGE,
          status: MediaStatus.READY,
          width: generatedThumbnail.width ?? undefined,
          height: generatedThumbnail.height ?? undefined,
          uploadedBy: userId,
          parentId: media.mediaId,
          alt: generatedAltTexts.thumbnailAlt || this.buildThumbnailAlt(dto.title),
        })
      } else if (!thumbnailMedia.alt && generatedAltTexts.thumbnailAlt) {
        thumbnailMedia = await repos.mediaRepository.update(thumbnailMedia.mediaId, {
          alt: generatedAltTexts.thumbnailAlt,
        })
      }

      await Promise.all(
        generatedContentImageMedias.map(async (contentMedia, index) => {
          const alt =
            generatedAltTexts.contentImageAlts.get(contentMedia.mediaId) ||
            contentMedia.alt ||
            this.buildContentImageAlt(dto.title, index)

          if (alt !== contentMedia.alt) {
            await repos.mediaRepository.update(contentMedia.mediaId, { alt })
          }
        }),
      )

      await repos.mediaUsageRepository.attach({
        mediaId: thumbnailMedia!.mediaId,
        entityType: EntityType.DOCUMENT,
        entityId: document.documentId,
        fieldName: DOCUMENT_MEDIA_FIELDS.DOCUMENT_THUMBNAIL,
        usedBy: userId,
        visibility: MediaVisibility.PUBLIC,
      })

      return document
    })

    return BaseResponseDto.success(
      'Tao tai lieu thanh cong',
      DocumentResponseDto.fromEntity(document),
    )
  }

  private buildThumbnailAlt(title: string): string {
    return `${title} - anh dai dien tai lieu`.slice(0, 255)
  }

  private buildContentImageAlt(title: string, index: number): string {
    return `${title} - hinh minh hoa ${index + 1}`.slice(0, 255)
  }
}
