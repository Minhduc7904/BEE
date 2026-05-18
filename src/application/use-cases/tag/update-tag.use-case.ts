import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TagResponseDto, UpdateTagDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { generateUniqueTagSlug } from './tag-slug.util'

@Injectable()
export class UpdateTagUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(tagId: number, dto: UpdateTagDto): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.tagRepository.findById(tagId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay tag')
      }

      const updateData = { ...dto }

      if (dto.name && dto.name !== existing.name) {
        const duplicated = await repos.tagRepository.findByName(dto.name)
        if (duplicated && duplicated.tagId !== tagId) {
          throw new ConflictException(`Tag '${dto.name}' da ton tai`)
        }

        updateData.slug = await generateUniqueTagSlug(
          dto.name,
          repos.tagRepository,
          existing.tagId,
          existing.slug,
        )
      }

      if (!updateData.slug && dto.slug && dto.slug !== existing.slug) {
        const duplicated = await repos.tagRepository.findBySlug(dto.slug)
        if (duplicated && duplicated.tagId !== tagId) {
          throw new ConflictException(`Slug '${dto.slug}' da ton tai`)
        }
      }

      return repos.tagRepository.update(tagId, updateData)
    })

    return BaseResponseDto.success('Cap nhat tag thanh cong', TagResponseDto.fromEntity(tag))
  }
}
