import { Injectable, Inject } from '@nestjs/common'
import { Readable } from 'stream'
import type { IMediaUsageRepository } from '../../../domain/repositories'
import { MinioService } from 'src/application/interfaces'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { MediaVisibility, MediaStatus } from 'src/shared/enums'

export interface MediaUsageContentResult {
  stream: Readable
  contentType: string
  size: number
  filename: string
}

/**
 * GetPublicMediaUsageContentUseCase - Serve raw file bytes for a PUBLIC media usage
 *
 * Keyed by usageId (not mediaId) so exposure is scoped to one attachment
 * context (e.g. a student's avatar) instead of the whole Media row.
 * No auth: gated purely by MediaUsage.visibility === PUBLIC.
 */
@Injectable()
export class GetPublicMediaUsageContentUseCase {
  constructor(
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) { }

  async execute(usageId: number): Promise<MediaUsageContentResult> {
    const usage = await this.mediaUsageRepository.findById(usageId)

    if (
      !usage ||
      usage.visibility !== MediaVisibility.PUBLIC ||
      !usage.media ||
      usage.media.status !== MediaStatus.READY
    ) {
      throw new NotFoundException(`Media usage with ID ${usageId} not found`)
    }

    const media = usage.media
    const stream = await this.minioService.getFileStream(
      media.bucketName,
      media.objectKey,
    )

    return {
      stream,
      contentType: media.mimeType,
      size: media.fileSize,
      filename: media.originalFilename,
    }
  }
}
