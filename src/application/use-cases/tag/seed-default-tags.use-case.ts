import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CHAPTERS, DOCUMENT_TYPE_TAGS, LEVEL_TAGS, SUBJECTS } from 'src/shared/constants'
import { TagType } from 'src/shared/enums'
import { generateUniqueTagSlug } from './tag-slug.util'

interface SeedTagSummary {
  type: TagType
  total: number
}

interface SeedTagItem {
  name: string
  slug?: string
}

interface SeedTagGroup {
  type: TagType
  items: SeedTagItem[]
}

@Injectable()
export class SeedDefaultTagsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(): Promise<BaseResponseDto<{ groups: SeedTagSummary[]; total: number }>> {
    const groups = await this.unitOfWork.executeInTransaction(async (repos) => {
      const seeds: SeedTagGroup[] = [
        {
          type: TagType.CHAPTER,
          items: this.uniqueNames(CHAPTERS.map((chapter) => chapter.name)).map((name) => ({ name })),
        },
        {
          type: TagType.SUBJECT,
          items: this.uniqueNames(SUBJECTS.map((subject) => subject.name)).map((name) => ({ name })),
        },
        {
          type: TagType.DOCUMENT_TYPE,
          items: this.uniqueItemsByName([...DOCUMENT_TYPE_TAGS]),
        },
        {
          type: TagType.LEVEL,
          items: this.uniqueItemsByName([...LEVEL_TAGS]),
        },
      ]

      const summaries: SeedTagSummary[] = []

      for (const seed of seeds) {
        for (const item of seed.items) {
          const slug = item.slug || await generateUniqueTagSlug(item.name, repos.tagRepository)

          await repos.tagRepository.upsertByName({
            name: item.name,
            slug,
            type: seed.type,
            isActive: true,
          })
        }

        summaries.push({
          type: seed.type,
          total: seed.items.length,
        })
      }

      return summaries
    })

    return BaseResponseDto.success('Seed tag mac dinh thanh cong', {
      groups,
      total: groups.reduce((sum, group) => sum + group.total, 0),
    })
  }

  private uniqueNames(names: string[]): string[] {
    return Array.from(new Set(names))
  }

  private uniqueItemsByName(items: SeedTagItem[]): SeedTagItem[] {
    return Array.from(
      new Map(items.map((item) => [item.name, item])).values(),
    )
  }
}
