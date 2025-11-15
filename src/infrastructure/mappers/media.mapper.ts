import { Media } from '@prisma/client'
import { MediaEntity } from '../../domain/entities/media.entity'

export class MediaMapper {
  static toDomain(prismaMedia: Media): MediaEntity {
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
      createdAt: prismaMedia.createdAt,
      updatedAt: prismaMedia.updatedAt,
    })
  }

  static toDomainList(prismaMediaList: Media[]): MediaEntity[] {
    return prismaMediaList.map((media) => this.toDomain(media))
  }
}
