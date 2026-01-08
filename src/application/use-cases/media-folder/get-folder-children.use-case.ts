import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaFolderResponseDto } from '../../dtos/media-folder'

/**
 * GetFolderChildrenUseCase - Get direct children of a folder
 */
@Injectable()
export class GetFolderChildrenUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(parentId: number | null, userId?: number): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    const children = await this.mediaFolderRepository.findChildren(parentId, userId)

    return BaseResponseDto.success('Children retrieved successfully', {
      data: children.map((f) => MediaFolderResponseDto.fromEntity(f)),
      total: children.length,
    })
  }
}
