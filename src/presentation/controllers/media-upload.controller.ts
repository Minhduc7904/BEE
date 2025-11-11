import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, Delete } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { MinioService } from '../../infrastructure/services/minio.service'

@Controller('media')
export class MediaUploadController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded')
    }

    const buckets = this.minioService.getBuckets()
    const timestamp = Date.now()
    const ext = file.originalname.split('.').pop()
    const objectKey = `uploads/${timestamp}.${ext}`

    const result = await this.minioService.uploadFile(
      buckets.documents,
      objectKey,
      file.buffer,
      {
        'Content-Type': file.mimetype,
        'X-Original-Name': file.originalname,
      }
    )

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...result,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
    }
  }

  @Get('download/:bucket/*')
  async downloadFile(
    @Param('bucket') bucket: string,
    @Param('*') objectKey: string,
    @Res() res: Response,
  ) {
    try {
      const fileBuffer = await this.minioService.downloadFile(bucket, objectKey)
      const metadata = await this.minioService.getFileMetadata(bucket, objectKey)

      res.setHeader('Content-Type', metadata.metaData['content-type'] || 'application/octet-stream')
      res.setHeader('Content-Length', metadata.size)
      res.setHeader('Content-Disposition', `attachment; filename="${objectKey.split('/').pop()}"`)

      res.send(fileBuffer)
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'File not found',
        error: error.message,
      })
    }
  }

  @Delete(':bucket/*')
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('*') objectKey: string,
  ) {
    try {
      await this.minioService.deleteFile(bucket, objectKey)
      return {
        success: true,
        message: 'File deleted successfully',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete file',
        error: error.message,
      }
    }
  }

  @Get('url/:bucket/*')
  async getPublicUrl(
    @Param('bucket') bucket: string,
    @Param('*') objectKey: string,
  ) {
    const publicUrl = await this.minioService.getPublicUrl(bucket, objectKey)
    return {
      success: true,
      data: { publicUrl },
    }
  }

  @Get('presigned/:bucket/*')
  async getPresignedUrl(
    @Param('bucket') bucket: string,
    @Param('*') objectKey: string,
  ) {
    const presignedUrl = await this.minioService.getPresignedUrl(bucket, objectKey, 3600)
    return {
      success: true,
      data: { presignedUrl, expiresIn: '1 hour' },
    }
  }

  @Get('list/:bucket')
  async listFiles(@Param('bucket') bucket: string) {
    const files = await this.minioService.listFiles(bucket, '', true)
    return {
      success: true,
      data: {
        bucket,
        count: files.length,
        files: files.map(f => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        })),
      },
    }
  }

  @Get('buckets')
  getBuckets() {
    const buckets = this.minioService.getBuckets()
    return {
      success: true,
      data: { buckets },
    }
  }
}
