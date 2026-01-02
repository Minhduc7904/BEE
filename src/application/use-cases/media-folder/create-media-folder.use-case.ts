import { Injectable, Inject } from '@nestjs/common'
import type { IMediaFolderRepository } from '../../../domain/repositories/media-folder.repository'
import { BaseResponseDto } from '../../dtos'
import { CreateMediaFolderDto, MediaFolderResponseDto } from '../../dtos/media-folder'

@Injectable()
export class CreateMediaFolderUseCase {
  constructor(
    @Inject('IMediaFolderRepository')
    private readonly mediaFolderRepository: IMediaFolderRepository,
  ) {}

  async execute(dto: CreateMediaFolderDto, userId: number) {
    const folder = await this.mediaFolderRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      parentId: dto.parentId,
      createdBy: userId,
    })

    return BaseResponseDto.success(
      'Folder created successfully',
      MediaFolderResponseDto.fromEntity(folder),
    )
  }
}
