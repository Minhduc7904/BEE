import { Media } from '@prisma/client'
import { MediaEntity } from '../../../domain/entities'
import { UserMapper } from '../user/user.mapper'
import { MediaUsageMapper } from './media-usage.mapper'
import { MediaFolderMapper } from './media-folder.mapper'

export class MediaMapper {
  static toDomain(prismaMedia: any): MediaEntity {
    return new MediaEntity({
      mediaId: prismaMedia.mediaId,
      folderId: prismaMedia.folderId ?? undefined,
      bucketName: prismaMedia.bucketName,
      objectKey: prismaMedia.objectKey,
      originalFilename: prismaMedia.originalName,
      mimeType: prismaMedia.mimeType,
      fileSize: Number(prismaMedia.fileSize),
      type: prismaMedia.type,
      status: prismaMedia.status,
      publicUrl: prismaMedia.publicUrl ?? undefined,
      width: prismaMedia.width ?? undefined,
      height: prismaMedia.height ?? undefined,
      duration: prismaMedia.duration ?? undefined,
      uploadedBy: prismaMedia.uploadedBy!,
      uploader: UserMapper.toDomainUser(prismaMedia.uploader) ?? undefined,
      usages: prismaMedia.usages
        ? prismaMedia.usages.map((usage: any) => MediaUsageMapper.toDomain(usage))
        : undefined,
      folder: prismaMedia.folder
        ? MediaFolderMapper.toDomain(prismaMedia.folder)
        : undefined,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
    })
  }

  static toDomainList(prismaMediaList: any[]): MediaEntity[] {
    return prismaMediaList.map((media) => this.toDomain(media))
  }
}
