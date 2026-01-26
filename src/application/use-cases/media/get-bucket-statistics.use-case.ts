import { Injectable, Logger } from '@nestjs/common'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { BaseResponseDto } from '../../dtos'
import { BucketStatisticsResponseDto, BucketItemDto } from '../../dtos/media-folder'

/**
 * GetBucketStatisticsUseCase - Get file statistics for all buckets
 *
 * Retrieves file count and total size for each configured bucket
 * Useful for monitoring storage usage and capacity planning
 */
@Injectable()
export class GetBucketStatisticsUseCase {
  private readonly logger = new Logger(GetBucketStatisticsUseCase.name)

  constructor(private readonly minioService: MinioService) {}

  async execute(): Promise<BaseResponseDto<BucketStatisticsResponseDto>> {
    const buckets = this.minioService.getBuckets()
    const bucketStatistics: BucketItemDto[] = []

    // Get statistics for each bucket
    for (const [bucketKey, bucketName] of Object.entries(buckets)) {
      try {
        const files = await this.minioService.listFiles(bucketName, '', true)

        // Calculate total size
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)

        bucketStatistics.push(
          new BucketItemDto({
            bucketKey,
            bucketName,
            fileCount: files.length,
            totalSize,
          }),
        )

        this.logger.log(`✅ Statistics for bucket ${bucketName}: ${files.length} files, ${this.formatBytes(totalSize)}`)
      } catch (error) {
        this.logger.warn(`⚠️ Failed to get statistics for bucket ${bucketName}: ${error.message}`)

        // Add bucket with zero stats if error occurs
        bucketStatistics.push(
          new BucketItemDto({
            bucketKey,
            bucketName,
            fileCount: 0,
            totalSize: 0,
          }),
        )
      }
    }

    const response = BucketStatisticsResponseDto.create(bucketStatistics)

    return BaseResponseDto.success('Bucket statistics retrieved successfully', response)
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}
