import { Injectable, Inject } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { GetMediaFolderListDto, MediaFolderResponseDto } from '../../dtos/media-folder'

@Injectable()
export class GetMediaFolderListUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) { }

  async execute(dto: GetMediaFolderListDto): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    const [folders, total] = await Promise.all([
      this.mediaFolderRepository.findMany(dto),
      this.mediaFolderRepository.count({
        parentId: dto.parentId,
        createdBy: dto.createdBy,
      }),
    ])

    return BaseResponseDto.success('Folders retrieved successfully', {
      data: folders.map((f) => MediaFolderResponseDto.fromEntity(f)),
      total,
    })
  }
}
