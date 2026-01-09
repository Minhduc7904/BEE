import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaFolderResponseDto } from '../../dtos/media-folder'
import { MediaType } from '@prisma/client'
/**
 * GetFolderChildrenUseCase - Get direct children of a folder
 */
@Injectable()
export class GetFolderChildrenUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(parentId: number | null, userId?: number, mediaType?: MediaType): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    const children = await this.mediaFolderRepository.findChildren(parentId, userId, true, mediaType)

    return BaseResponseDto.success('Children retrieved successfully', {
      data: children.map((f) => MediaFolderResponseDto.fromEntity(f)),
      total: children.length,
    })
  }
}
