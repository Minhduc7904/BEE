import { MediaEntity } from '../entities/media.entity'
import { MediaType, MediaStatus } from '@prisma/client'

export interface IMediaRepository {
  create(data: {
    folderId?: number
    bucketName: string
    objectKey: string
    originalFilename: string
    mimeType: string
    fileSize: number
    type: MediaType
    status: MediaStatus
    publicUrl?: string
    width?: number
    height?: number
    duration?: number
    uploadedBy: number | null
  }): Promise<MediaEntity>

  findById(mediaId: number): Promise<MediaEntity | null>

  findMany(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    skip?: number
    take?: number
  }): Promise<MediaEntity[]>

  update(
    mediaId: number,
    data: {
      folderId?: number
      status?: MediaStatus
      publicUrl?: string
      width?: number
      height?: number
      duration?: number
      uploadedBy?: number
    },
  ): Promise<MediaEntity>

  delete(mediaId: number): Promise<void>

  softDelete(mediaId: number): Promise<MediaEntity>

  count(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
  }): Promise<number>
}
