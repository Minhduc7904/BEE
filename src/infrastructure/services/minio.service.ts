import { Injectable, Logger, OnModuleInit, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'
import { Readable } from 'stream'

/**
 * MinioService - Production-ready MinIO integration
 * 
 * SECURITY PRINCIPLES:
 * - All buckets are PRIVATE (no public access)
 * - Access control handled via presigned URLs ONLY
 * - No direct URL exposure
 * - Authorization handled at application layer (Guards/MediaUsage)
 * 
 * ARCHITECTURE:
 * - Pure storage service (no business logic)
 * - No auth/permission checks (delegated to upper layers)
 * - Stream-based for large files
 * - Production-safe (no auto-create in prod)
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name)
  private readonly minioClient: Minio.Client
  private readonly buckets: Record<string, string>
  private readonly isProduction: boolean
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // ms

  constructor(private readonly configService: ConfigService) {
    const minioConfig = this.configService.get('minio')
    this.isProduction = this.configService.get('NODE_ENV') === 'production'

    this.minioClient = new Minio.Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
      region: 'us-east-1', // Default region for MinIO
      pathStyle: true, // Use path-style URLs for MinIO compatibility
    })

    this.buckets = minioConfig.buckets
    this.logger.log(`MinIO client initialized: ${minioConfig.endPoint}:${minioConfig.port} (Production: ${this.isProduction})`)
  }

  async onModuleInit() {
    // Wait for MinIO to be ready with retry logic
    await this.waitForMinioConnection()
    
    // Only auto-create buckets in non-production environments
    if (!this.isProduction) {
      await this.createPrivateBucketsIfNotExist()
    } else {
      this.logger.warn('Production mode: Buckets must be created manually. Skipping auto-creation.')
      await this.verifyBucketsExist()
    }
  }

  /**
   * Wait for MinIO connection to be ready with retry logic
   */
  private async waitForMinioConnection(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Try to list buckets as a connection test
        await this.minioClient.listBuckets()
        this.logger.log('✅ MinIO connection established')
        return
      } catch (error) {
        this.logger.warn(`⚠️ MinIO connection attempt ${attempt}/${this.maxRetries} failed: ${error.message}`)
        
        if (attempt === this.maxRetries) {
          this.logger.error('❌ Failed to connect to MinIO after maximum retries')
          throw new InternalServerErrorException(
            'Failed to connect to MinIO storage. Please ensure MinIO is running and credentials are correct.'
          )
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  /**
   * Create all PRIVATE buckets if not exist (dev/staging only)
   * Buckets are created WITHOUT public access policy
   */
  private async createPrivateBucketsIfNotExist(): Promise<void> {
    try {
      for (const [key, bucketName] of Object.entries(this.buckets)) {
        const exists = await this.minioClient.bucketExists(bucketName)
        if (!exists) {
          await this.minioClient.makeBucket(bucketName, 'us-east-1')
          this.logger.log(`✅ PRIVATE bucket created: ${bucketName}`)
        } else {
          this.logger.log(`ℹ️ Bucket already exists: ${bucketName}`)
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error creating buckets: ${error.message}`)
      throw new InternalServerErrorException('Failed to initialize storage buckets')
    }
  }

  /**
   * Verify all required buckets exist (production mode)
   */
  private async verifyBucketsExist(): Promise<void> {
    try {
      for (const [key, bucketName] of Object.entries(this.buckets)) {
        const exists = await this.minioClient.bucketExists(bucketName)
        if (!exists) {
          throw new Error(`Required bucket does not exist: ${bucketName}`)
        }
        this.logger.log(`✅ Verified bucket exists: ${bucketName}`)
      }
    } catch (error) {
      this.logger.error(`❌ Bucket verification failed: ${error.message}`)
      throw new InternalServerErrorException('Storage configuration error')
    }
  }

  // ==================== UPLOAD OPERATIONS ====================

  /**
   * Upload file from Buffer (suitable for small files)
   * For large files, use uploadFileStream() instead
   * 
   * @param bucketName - Target bucket
   * @param objectKey - Object path (e.g., 'avatars/user-123.jpg')
   * @param buffer - File buffer
   * @param metadata - Optional metadata (Content-Type, etc.)
   * @returns Upload result without public URL (use presigned URL instead)
   */
  async uploadFile(
    bucketName: string,
    objectKey: string,
    buffer: Buffer,
    metadata?: Record<string, string>,
  ): Promise<{ bucketName: string; objectKey: string; etag: string }> {
    return this.uploadWithRetry(async () => {
      const metaData = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        ...metadata,
      }

      const result = await this.minioClient.putObject(bucketName, objectKey, buffer, buffer.length, metaData)
      this.logger.log(`✅ File uploaded: ${bucketName}/${objectKey} (${buffer.length} bytes)`)

      return {
        bucketName,
        objectKey,
        etag: result.etag,
      }
    })
  }

  /**
   * Upload file from Stream (suitable for large files)
   * Prevents loading entire file into memory
   * 
   * @param bucketName - Target bucket
   * @param objectKey - Object path
   * @param stream - Readable stream
   * @param metadata - Optional metadata
   * @returns Upload result
   */
  async uploadFileStream(
    bucketName: string,
    objectKey: string,
    stream: Readable,
    metadata?: Record<string, string>,
  ): Promise<{ bucketName: string; objectKey: string; etag: string }> {
    return this.uploadWithRetry(async () => {
      const metaData = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        ...metadata,
      }

      // Note: Pass undefined for size when using stream with unknown size
      const result = await this.minioClient.putObject(bucketName, objectKey, stream, undefined as any, metaData)
      this.logger.log(`✅ File uploaded (stream): ${bucketName}/${objectKey}`)

      return {
        bucketName,
        objectKey,
        etag: result.etag,
      }
    })
  }

  /**
   * Retry wrapper for upload operations
   */
  private async uploadWithRetry<T>(uploadFn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await uploadFn()
      } catch (error) {
        lastError = error
        this.logger.warn(`Upload attempt ${attempt}/${this.maxRetries} failed: ${error.message}`)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt)
        }
      }
    }
    this.logger.error(`Upload failed after ${this.maxRetries} attempts`)
    throw new InternalServerErrorException(`Upload failed: ${lastError?.message || 'Unknown error'}`)
  }

  // ==================== DOWNLOAD OPERATIONS ====================

  /**
   * Download file as Buffer (for small files or when buffer needed)
   * For large files, consider streaming directly to response
   */
  async downloadFile(bucketName: string, objectKey: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(bucketName, objectKey)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk))
        dataStream.on('end', () => {
          const buffer = Buffer.concat(chunks)
          this.logger.log(`✅ File downloaded: ${bucketName}/${objectKey} (${buffer.length} bytes)`)
          resolve(buffer)
        })
        dataStream.on('error', (error) => {
          this.logger.error(`❌ Download error: ${error.message}`)
          reject(this.normalizeMinioError(error, objectKey))
        })
      })
    } catch (error) {
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Get file stream for efficient downloading (recommended for large files)
   */
  async getFileStream(bucketName: string, objectKey: string): Promise<Readable> {
    try {
      const stream = await this.minioClient.getObject(bucketName, objectKey)
      this.logger.log(`✅ File stream created: ${bucketName}/${objectKey}`)
      return stream
    } catch (error) {
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Get partial file stream with range support (for video streaming)
   * Supports HTTP Range Requests (e.g., "bytes=0-1023")
   * 
   * @param bucketName - Source bucket
   * @param objectKey - Object path
   * @param offset - Start byte position (0-based)
   * @param length - Number of bytes to read (optional, reads to end if not specified)
   * @returns Readable stream of the requested range
   */
  async getPartialStream(
    bucketName: string, 
    objectKey: string, 
    offset: number = 0, 
    length?: number
  ): Promise<Readable> {
    try {
      // MinIO client supports range requests via getPartialObject
      const stream = await this.minioClient.getPartialObject(
        bucketName,
        objectKey,
        offset,
        length
      )
      this.logger.log(`✅ Partial stream created: ${bucketName}/${objectKey} (offset: ${offset}, length: ${length || 'to-end'})`)
      return stream
    } catch (error) {
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  // ==================== PRESIGNED URL OPERATIONS ====================

  /**
   * Generate presigned GET URL for downloading file
   * This is the ONLY way clients should access files
   * 
   * @param bucketName - Source bucket
   * @param objectKey - Object path
   * @param expirySeconds - URL expiry time (default: 1 hour)
   * @param fileName - Optional: Override filename for Content-Disposition
   * @returns Temporary signed URL
   */
  async getPresignedDownloadUrl(
    bucketName: string,
    objectKey: string,
    expirySeconds = 3600,
    fileName?: string,
  ): Promise<string> {
    try {
      // Add Content-Disposition header for download with custom filename
      const requestHeaders: Record<string, string> = {}
      if (fileName) {
        requestHeaders['response-content-disposition'] = `attachment; filename="${encodeURIComponent(fileName)}"`
      }

      const url = await this.minioClient.presignedGetObject(
        bucketName,
        objectKey,
        expirySeconds,
        requestHeaders,
      )

      this.logger.log(`✅ Presigned download URL generated: ${objectKey} (expires in ${expirySeconds}s)`)
      return url
    } catch (error) {
      this.logger.error(`❌ Error generating presigned download URL: ${error.message}`)
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Generate presigned URL for viewing/previewing media inline
   * Opens in browser instead of forcing download
   * 
   * @param bucketName - Target bucket
   * @param objectKey - Object path
   * @param expirySeconds - URL expiry time (default: 1 hour)
   * @returns Temporary signed URL for viewing
   */
  async getPresignedUrl(
    bucketName: string,
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    try {
      // No Content-Disposition header = inline viewing in browser
      const url = await this.minioClient.presignedGetObject(
        bucketName,
        objectKey,
        expirySeconds,
      )

      this.logger.log(`✅ Presigned view URL generated: ${objectKey} (expires in ${expirySeconds}s)`)
      return url
    } catch (error) {
      this.logger.error(`❌ Error generating presigned view URL: ${error.message}`)
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Generate presigned PUT URL for direct client upload
   * Useful for large files or reducing server load
   * 
   * @param bucketName - Target bucket
   * @param objectKey - Object path
   * @param expirySeconds - URL expiry time (default: 1 hour)
   * @returns Temporary signed URL for uploading
   */
  async getPresignedUploadUrl(
    bucketName: string,
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedPutObject(bucketName, objectKey, expirySeconds)
      this.logger.log(`✅ Presigned upload URL generated: ${objectKey} (expires in ${expirySeconds}s)`)
      return url
    } catch (error) {
      this.logger.error(`❌ Error generating presigned upload URL: ${error.message}`)
      throw new InternalServerErrorException(`Failed to generate upload URL: ${error.message}`)
    }
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Delete file from MinIO
   */
  async deleteFile(bucketName: string, objectKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, objectKey)
      this.logger.log(`✅ File deleted: ${bucketName}/${objectKey}`)
    } catch (error) {
      this.logger.error(`❌ Delete error: ${error.message}`)
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucketName: string, objectKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucketName, objectKey)
      return true
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false
      }
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Get file metadata (size, etag, content-type, etc.)
   */
  async getFileMetadata(bucketName: string, objectKey: string): Promise<Minio.BucketItemStat> {
    try {
      const stat = await this.minioClient.statObject(bucketName, objectKey)
      this.logger.log(`✅ Metadata retrieved: ${objectKey} (${stat.size} bytes)`)
      return stat
    } catch (error) {
      throw this.normalizeMinioError(error, objectKey)
    }
  }

  /**
   * Copy file within MinIO
   */
  async copyFile(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string,
  ): Promise<void> {
    try {
      const conds = new Minio.CopyConditions()
      await this.minioClient.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`, conds)
      this.logger.log(`✅ File copied: ${sourceBucket}/${sourceObject} → ${destBucket}/${destObject}`)
    } catch (error) {
      this.logger.error(`❌ Copy error: ${error.message}`)
      throw new InternalServerErrorException(`Failed to copy file: ${error.message}`)
    }
  }

  /**
   * List files in bucket with optional prefix
   */
  async listFiles(bucketName: string, prefix = '', recursive = false): Promise<Minio.BucketItem[]> {
    try {
      const objectsStream = this.minioClient.listObjects(bucketName, prefix, recursive)
      const objects: Minio.BucketItem[] = []

      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj: Minio.BucketItem) => {
          if (obj.name) {
            objects.push(obj)
          }
        })
        objectsStream.on('end', () => {
          this.logger.log(`✅ Listed ${objects.length} files in ${bucketName}/${prefix}`)
          resolve(objects)
        })
        objectsStream.on('error', reject)
      })
    } catch (error) {
      this.logger.error(`❌ List error: ${error.message}`)
      throw new InternalServerErrorException(`Failed to list files: ${error.message}`)
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get available bucket names
   */
  getBuckets(): Record<string, string> {
    return this.buckets
  }

  /**
   * Get MinIO client instance (for advanced operations)
   * Use sparingly - prefer using service methods
   */
  getClient(): Minio.Client {
    return this.minioClient
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Normalize MinIO errors to NestJS exceptions
   */
  private normalizeMinioError(error: any, objectKey?: string): Error {
    if (this.isNotFoundError(error)) {
      return new NotFoundException(`File not found: ${objectKey || 'unknown'}`)
    }
    return new InternalServerErrorException(`Storage error: ${error.message}`)
  }

  /**
   * Check if error is NotFound/NoSuchKey
   */
  private isNotFoundError(error: any): boolean {
    return error.code === 'NotFound' || error.code === 'NoSuchKey'
  }

  /**
   * Simple delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
