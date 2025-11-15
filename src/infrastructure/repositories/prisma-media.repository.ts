import { Injectable } from '@nestjs/common'
import { MediaEntity } from '../../domain/entities/media.entity'
import { IMediaRepository } from '../../domain/repositories/media.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { MediaType, MediaStatus } from '@prisma/client'
import { MediaMapper } from '../mappers/media.mapper'

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService | any) {} // any để hỗ trợ transaction client

  async create(data: {
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
  }): Promise<MediaEntity> {
    const media = await this.prisma.media.create({
      data: {
        folderId: data.folderId,
        bucketName: data.bucketName,
        objectKey: data.objectKey,
        fileName: data.objectKey.split('/').pop() || data.originalFilename,
        originalName: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: BigInt(data.fileSize),
        type: data.type,
        status: data.status,
        publicUrl: data.publicUrl,
        width: data.width,
        height: data.height,
        duration: data.duration,
        uploadedBy: data.uploadedBy,
      },
    })

    return MediaMapper.toDomain(media)
  }

  async findById(mediaId: number): Promise<MediaEntity | null> {
    const media = await this.prisma.media.findUnique({
      where: { mediaId },
    })

    return media ? MediaMapper.toDomain(media) : null
  }

  async findMany(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
    skip?: number
    take?: number
  }): Promise<MediaEntity[]> {
    const { skip, take, ...where } = filters

    const media = await this.prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })

    return MediaMapper.toDomainList(media)
  }

  async update(
    mediaId: number,
    data: {
      folderId?: number
      status?: MediaStatus
      publicUrl?: string
      width?: number
      height?: number
      duration?: number
    },
  ): Promise<MediaEntity> {
    const media = await this.prisma.media.update({
      where: { mediaId },
      data,
    })

    return MediaMapper.toDomain(media)
  }

  async delete(mediaId: number): Promise<void> {
    await this.prisma.media.delete({
      where: { mediaId },
    })
  }

  async softDelete(mediaId: number): Promise<MediaEntity> {
    const media = await this.prisma.media.update({
      where: { mediaId },
      data: { status: MediaStatus.DELETED },
    })

    return MediaMapper.toDomain(media)
  }

  async count(filters: {
    folderId?: number
    type?: MediaType
    status?: MediaStatus
    uploadedBy?: number
  }): Promise<number> {
    return await this.prisma.media.count({
      where: filters,
    })
  }
}
