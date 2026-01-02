import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'

@Injectable()
export class DeleteMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(folderId: number) {
    const folder = await this.mediaFolderRepository.findById(folderId)
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }

    await this.mediaFolderRepository.delete(folderId)

    return BaseResponseDto.success('Folder deleted successfully', {
      deleted: true,
      message: 'Folder and its contents have been deleted',
    })
  }
}
