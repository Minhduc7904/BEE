import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { UpdateMediaFolderDto, MediaFolderResponseDto } from '../../dtos/media-folder'

@Injectable()
export class UpdateMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(folderId: number, dto: UpdateMediaFolderDto) {
    const exists = await this.mediaFolderRepository.findById(folderId)
    if (!exists) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }

    const folder = await this.mediaFolderRepository.update(folderId, dto)

    return BaseResponseDto.success(
      'Folder updated successfully',
      MediaFolderResponseDto.fromEntity(folder),
    )
  }
}
