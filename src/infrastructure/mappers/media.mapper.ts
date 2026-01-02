import { Media } from '@prisma/client'
import { MediaEntity } from '../../domain/entities/media.entity'

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
      uploader: prismaMedia.uploader
        ? {
          userId: prismaMedia.uploader.userId,
          username: prismaMedia.uploader.username,
          firstName: prismaMedia.uploader.firstName,
          lastName: prismaMedia.uploader.lastName,
        }
        : undefined,
      usages: prismaMedia.usages
        ? prismaMedia.usages.map((usage: any) => ({
          usageId: usage.usageId,
          entityType: usage.entityType,
          entityId: usage.entityId,
          fieldName: usage.fieldName,
          visibility: usage.visibility,
          createdAt: usage.createdAt,
        }))
        : undefined,
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
    })
  }

  static toDomainList(prismaMediaList: any[]): MediaEntity[] {
    return prismaMediaList.map((media) => this.toDomain(media))
  }
}
