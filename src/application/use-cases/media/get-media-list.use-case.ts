import { Injectable, Inject } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { GetMediaListDto, MediaResponseDto } from '../../dtos/media'

@Injectable()
export class GetMediaListUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) { }

  async execute(dto: GetMediaListDto): Promise<PaginationResponseDto<MediaResponseDto>> {
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

    const data = media.map((m) => MediaResponseDto.fromEntity(m))

    return PaginationResponseDto.success(
      'Media list retrieved successfully',
      data,
      dto.page || 1,
      dto.limit || 10,
      total,
    )
  }
}
