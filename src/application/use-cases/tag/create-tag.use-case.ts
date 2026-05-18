import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateTagDto, TagResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { generateUniqueTagSlug } from './tag-slug.util'

@Injectable()
export class CreateTagUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(dto: CreateTagDto): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existingByName = await repos.tagRepository.findByName(dto.name)
      if (existingByName) {
        throw new ConflictException(`Tag '${dto.name}' da ton tai`)
      }

      const slug = await generateUniqueTagSlug(dto.name, repos.tagRepository)

      return repos.tagRepository.create({
        name: dto.name,
        slug,
        type: dto.type,
        description: dto.description,
        isActive: dto.isActive,
      })
    })

    return BaseResponseDto.success('Tao tag thanh cong', TagResponseDto.fromEntity(tag))
  }
}
