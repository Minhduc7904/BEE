import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaFolderResponseDto } from '../../dtos/media-folder'

@Injectable()
export class GetMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(folderId: number) {
    const folder = await this.mediaFolderRepository.findById(folderId)

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }

    return BaseResponseDto.success(
      'Folder retrieved successfully',
      MediaFolderResponseDto.fromEntity(folder),
    )
  }
}
