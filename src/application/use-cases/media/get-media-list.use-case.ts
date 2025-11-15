import { Injectable, Inject } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { BaseResponseDto } from '../../dtos'
import { GetMediaListDto, MediaResponseDto } from '../../dtos/media'

@Injectable()
export class GetMediaListUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async execute(dto: GetMediaListDto) {
    const [media, total] = await Promise.all([
      this.mediaRepository.findMany(dto),
      this.mediaRepository.count({
        folderId: dto.folderId,
        type: dto.type,
        status: dto.status,
        uploadedBy: dto.uploadedBy,
      }),
    ])

    return BaseResponseDto.success(
      'Media list retrieved successfully',
      {
        data: media.map(m => MediaResponseDto.fromEntity(m)),
        total,
      }
    )
  }
}
