import { Injectable, Inject } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { UpdateMediaFolderDto, MediaFolderResponseDto } from '../../dtos/media-folder'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
@Injectable()
export class UpdateMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(
    folderId: number,
    dto: UpdateMediaFolderDto,
    userId: number,
  ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
    const exists = await this.mediaFolderRepository.findById(folderId)
    if (!exists) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }

    const folder = await this.mediaFolderRepository.update(folderId, dto)
    if (folder.createdBy !== userId) {
      throw new ConflictException(`You do not have permission to update this folder`)
    }
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found after update`)
    }
    return BaseResponseDto.success('Folder updated successfully', MediaFolderResponseDto.fromEntity(folder))
  }
}
