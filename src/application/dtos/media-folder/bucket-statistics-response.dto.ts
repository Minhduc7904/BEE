/**
 * BucketStatisticsResponseDto - Response DTO for bucket statistics
 * 
 * Contains file count and size statistics for each bucket
 */

export class BucketItemDto {
  bucketKey: string
  bucketName: string
  fileCount: number
  totalSize: number // in bytes

  constructor(data: { bucketKey: string; bucketName: string; fileCount: number; totalSize: number }) {
    this.bucketKey = data.bucketKey
    this.bucketName = data.bucketName
    this.fileCount = data.fileCount
    this.totalSize = data.totalSize
  }
}

export class BucketStatisticsResponseDto {
  buckets: BucketItemDto[]
  totalFiles: number
  totalSize: number // in bytes
  timestamp: Date

  constructor(data: { buckets: BucketItemDto[]; totalFiles: number; totalSize: number }) {
    this.buckets = data.buckets
    this.totalFiles = data.totalFiles
    this.totalSize = data.totalSize
    this.timestamp = new Date()
  }

  static create(buckets: BucketItemDto[]): BucketStatisticsResponseDto {
    const totalFiles = buckets.reduce((sum, bucket) => sum + bucket.fileCount, 0)
    const totalSize = buckets.reduce((sum, bucket) => sum + bucket.totalSize, 0)

    return new BucketStatisticsResponseDto({
      buckets,
      totalFiles,
      totalSize,
    })
  }
}
