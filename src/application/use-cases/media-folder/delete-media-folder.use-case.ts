import { Injectable, Inject } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(folderId: number, userId: number): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    const folder = await this.mediaFolderRepository.findById(folderId)
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${folderId} not found`)
    }
    if (folder.createdBy !== userId) {
      throw new ConflictException(`You do not have permission to delete this folder`)
    }
    await this.mediaFolderRepository.delete(folderId)

    return BaseResponseDto.success('Folder deleted successfully', {
      deleted: true,
      message: 'Folder and its contents have been deleted',
    })
  }
}
