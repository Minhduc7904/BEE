import { Injectable, Inject } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { MediaFolderResponseDto } from '../../dtos/media-folder'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
@Injectable()
export class GetMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) { }

  async execute(folderId: number, userId: number): Promise<BaseResponseDto<MediaFolderResponseDto>> {
    const folder = await this.mediaFolderRepository.findById(folderId)

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }

    if (folder.createdBy !== userId) {
      throw new ConflictException(`You do not have access to this folder`)
    }

    return BaseResponseDto.success('Folder retrieved successfully', MediaFolderResponseDto.fromEntity(folder))
  }
}
