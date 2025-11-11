import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Minio from 'minio'

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name)
  private minioClient: Minio.Client
  private buckets: Record<string, string>

  constructor(private configService: ConfigService) {
    const minioConfig = this.configService.get('minio')

    this.minioClient = new Minio.Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    })

    this.buckets = minioConfig.buckets
    this.logger.log(`MinIO client initialized: ${minioConfig.endPoint}:${minioConfig.port}`)
  }

  async onModuleInit() {
    // Tự động tạo các buckets khi khởi động
    await this.createBucketsIfNotExist()
  }

  /**
   * Tạo tất cả buckets nếu chưa tồn tại
   */
  private async createBucketsIfNotExist() {
    try {
      for (const [key, bucketName] of Object.entries(this.buckets)) {
        const exists = await this.minioClient.bucketExists(bucketName)
        if (!exists) {
          await this.minioClient.makeBucket(bucketName, 'us-east-1')
          this.logger.log(`Bucket created: ${bucketName}`)

          // Set policy cho bucket để có thể public read (tuỳ chọn)
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          }
          await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
          this.logger.log(`Bucket policy set: ${bucketName}`)
        } else {
          this.logger.log(`Bucket already exists: ${bucketName}`)
        }
      }
    } catch (error) {
      this.logger.error('Error creating buckets:', error)
    }
  }

  /**
   * Upload file lên MinIO
   */
  async uploadFile(
    bucketName: string,
    objectKey: string,
    buffer: Buffer,
    metadata?: Record<string, string>,
  ): Promise<{ bucketName: string; objectKey: string; publicUrl: string }> {
    try {
      const metaData = {
        'Content-Type': metadata?.['Content-Type'] || 'application/octet-stream',
        ...metadata,
      }

      await this.minioClient.putObject(bucketName, objectKey, buffer, buffer.length, metaData)

      const publicUrl = await this.getPublicUrl(bucketName, objectKey)

      this.logger.log(`File uploaded: ${bucketName}/${objectKey}`)

      return {
        bucketName,
        objectKey,
        publicUrl,
      }
    } catch (error) {
      this.logger.error(`Error uploading file to MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Download file từ MinIO
   */
  async downloadFile(bucketName: string, objectKey: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(bucketName, objectKey)
      const chunks: Buffer[] = []

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk))
        dataStream.on('end', () => resolve(Buffer.concat(chunks)))
        dataStream.on('error', reject)
      })
    } catch (error) {
      this.logger.error(`Error downloading file from MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Xoá file khỏi MinIO
   */
  async deleteFile(bucketName: string, objectKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, objectKey)
      this.logger.log(`File deleted: ${bucketName}/${objectKey}`)
    } catch (error) {
      this.logger.error(`Error deleting file from MinIO: ${error.message}`)
      throw error
    }
  }

  /**
   * Lấy URL công khai của file (presigned URL hoặc direct URL)
   */
  async getPublicUrl(bucketName: string, objectKey: string): Promise<string> {
    const minioConfig = this.configService.get('minio')
    const protocol = minioConfig.useSSL ? 'https' : 'http'
    return `${protocol}://${minioConfig.endPoint}:${minioConfig.port}/${bucketName}/${objectKey}`
  }

  /**
   * Lấy presigned URL (URL tạm thời) để download file
   */
  async getPresignedUrl(bucketName: string, objectKey: string, expirySeconds = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(bucketName, objectKey, expirySeconds)
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`)
      throw error
    }
  }

  /**
   * Lấy presigned URL để upload file
   */
  async getPresignedUploadUrl(bucketName: string, objectKey: string, expirySeconds = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(bucketName, objectKey, expirySeconds)
    } catch (error) {
      this.logger.error(`Error generating presigned upload URL: ${error.message}`)
      throw error
    }
  }

  /**
   * Kiểm tra file có tồn tại không
   */
  async fileExists(bucketName: string, objectKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucketName, objectKey)
      return true
    } catch (error) {
      if (error.code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  /**
   * Lấy metadata của file
   */
  async getFileMetadata(bucketName: string, objectKey: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.minioClient.statObject(bucketName, objectKey)
    } catch (error) {
      this.logger.error(`Error getting file metadata: ${error.message}`)
      throw error
    }
  }

  /**
   * Copy file trong MinIO
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
      this.logger.log(`File copied: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`)
    } catch (error) {
      this.logger.error(`Error copying file: ${error.message}`)
      throw error
    }
  }

  /**
   * List files trong bucket
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
        objectsStream.on('end', () => resolve(objects))
        objectsStream.on('error', reject)
      })
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`)
      throw error
    }
  }

  /**
   * Get MinIO client instance (nếu cần thao tác trực tiếp)
   */
  getClient(): Minio.Client {
    return this.minioClient
  }

  /**
   * Get bucket names
   */
  getBuckets(): Record<string, string> {
    return this.buckets
  }
}
