import { Injectable, Inject } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { GetMediaListDto, MediaResponseDto } from '../../dtos/media'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MediaType, MediaStatus } from 'src/shared/enums'

@Injectable()
export class GetMediaListUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    private readonly minioService: MinioService,
  ) { }

  async execute(dto: GetMediaListDto, userId?: number): Promise<PaginationResponseDto<MediaResponseDto>> {
    const commonFilters = {
      folderId: dto.folderId,
      type: dto.type,
      status: dto.status,
      uploadedBy: dto.uploadedBy,
      bucketName: dto.bucketName,
      search: dto.search,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
    }

    const [media, total] = await Promise.all([
      this.mediaRepository.findMany(dto),
      this.mediaRepository.count(commonFilters),
    ])

    // Map to DTOs and generate viewUrl for IMAGE types
    const data = await Promise.all(
      media.map(async (m) => {
        const dto = MediaResponseDto.fromEntity(m)
        
        // Generate viewUrl for IMAGE media that are READY
        if (m.type === MediaType.IMAGE && m.status === MediaStatus.READY) {
          try {
            // Only generate if user is logged in (has userId)
            if (userId) {
              const viewUrl = await this.minioService.getPresignedUrl(
                m.bucketName,
                m.objectKey,
                3600, // 1 hour expiry
              )
              dto.viewUrl = viewUrl
            }
          } catch (error) {
            // If viewUrl generation fails, just skip it
            console.error(`Failed to generate viewUrl for media ${m.mediaId}:`, error)
          }
        }
        
        return dto
      })
    )

    return PaginationResponseDto.success(
      'Media list retrieved successfully',
      data,
      dto.page || 1,
      dto.limit || 10,
      total,
    )
  }
}
