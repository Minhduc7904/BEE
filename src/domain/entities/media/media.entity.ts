import { MediaType, MediaStatus } from 'src/shared/enums'
import { User } from '../user'
import { MediaUsageEntity } from './media-usage.entity'
import { MediaFolderEntity } from './media-folder.entity'
export class MediaEntity {
  mediaId: number
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
  uploadedBy: number
  uploader?: User
  usages?: Array<MediaUsageEntity>
  folder?: MediaFolderEntity
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    mediaId: number
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
    uploadedBy: number
    uploader?: User
    usages?: Array<MediaUsageEntity>
    folder?: MediaFolderEntity
    createdAt: Date
    updatedAt: Date
  }) {
    Object.assign(this, data)
  }

  isImage(): boolean {
    return this.type === MediaType.IMAGE
  }

  isVideo(): boolean {
    return this.type === MediaType.VIDEO
  }

  isDocument(): boolean {
    return this.type === MediaType.DOCUMENT
  }

  isReady(): boolean {
    return this.status === MediaStatus.READY
  }

  isUploading(): boolean {
    return this.status === MediaStatus.UPLOADING
  }

  isFailed(): boolean {
    return this.status === MediaStatus.FAILED
  }
}
