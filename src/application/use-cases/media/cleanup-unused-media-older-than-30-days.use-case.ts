import { Inject, Injectable, Logger } from '@nestjs/common'
import type { IMediaRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { MinioService } from 'src/application/interfaces'

interface CleanupUnusedMediaResultItem {
  mediaId: number
  bucketName: string
  objectKey: string
  status: 'deleted' | 'skipped' | 'failed'
  reason?: string
}

interface CleanupUnusedMediaResponse {
  olderThanDays: number
  cutoffDate: string
  totalCandidates: number
  deletedCount: number
  skippedCount: number
  failedCount: number
  results: CleanupUnusedMediaResultItem[]
}

@Injectable()
export class CleanupUnusedMediaOlderThan30DaysUseCase {
  private readonly logger = new Logger(CleanupUnusedMediaOlderThan30DaysUseCase.name)

  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,

    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,

    private readonly minioService: MinioService,
  ) {}

  async execute(): Promise<BaseResponseDto<CleanupUnusedMediaResponse>> {
    const olderThanDays = 30
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

    const candidates = await this.mediaRepository.findMany({
      toDate: cutoffDate.toISOString(),
      includeDeleted: false,
      page: 1,
      limit: 5000,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    })

    const results: CleanupUnusedMediaResultItem[] = []

    for (const media of candidates) {
      const usageCount = await this.mediaUsageRepository.countByMedia(media.mediaId)
      if (usageCount > 0) {
        results.push({
          mediaId: media.mediaId,
          bucketName: media.bucketName,
          objectKey: media.objectKey,
          status: 'skipped',
          reason: `Media dang duoc su dung (${usageCount} usages)`,
        })
        continue
      }

      try {
        await this.minioService.deleteFile(media.bucketName, media.objectKey)
        await this.mediaRepository.hardDelete(media.mediaId)

        results.push({
          mediaId: media.mediaId,
          bucketName: media.bucketName,
          objectKey: media.objectKey,
          status: 'deleted',
        })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error'
        this.logger.error(
          `Failed to hard delete mediaId=${media.mediaId}, path=${media.bucketName}/${media.objectKey}: ${reason}`,
        )

        results.push({
          mediaId: media.mediaId,
          bucketName: media.bucketName,
          objectKey: media.objectKey,
          status: 'failed',
          reason,
        })
      }
    }

    const deletedCount = results.filter((r) => r.status === 'deleted').length
    const skippedCount = results.filter((r) => r.status === 'skipped').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    return BaseResponseDto.success('Da cleanup media khong duoc su dung thanh cong', {
      olderThanDays,
      cutoffDate: cutoffDate.toISOString(),
      totalCandidates: candidates.length,
      deletedCount,
      skippedCount,
      failedCount,
      results,
    })
  }
}
