import { Inject, Injectable } from '@nestjs/common'
import {
  BaseResponseDto,
  DocumentListQueryDto,
  DocumentSeoLevelResponseDto,
  DocumentSeoSectionResponseDto,
  DocumentSeoSectionKey,
  DocumentTagResponseDto,
} from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { TagType, Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { GetDocumentsUseCase } from './get-documents.use-case'

type LevelSlug = 'thpt' | 'thcs'

interface LevelSectionConfig {
  key: DocumentSeoSectionKey
  title: string
  tagSlugs?: string[]
}

const SECTION_LIMIT = 5

const LEVEL_SECTION_CONFIGS: Record<LevelSlug, LevelSectionConfig[]> = {
  thpt: [
    { key: 'latest', title: 'Tài liệu mới nhất' },
    {
      key: 'thpt_math_review',
      title: 'Tài liệu ôn thi THPT môn toán',
      tagSlugs: ['tai-lieu-on-thi-thpt'],
    },
    {
      key: 'thpt_math_exams',
      title: 'Đề thi THPT môn toán',
      tagSlugs: ['de-thi-thu-thpt', 'de-thpt-chinh-thuc', 'de-danh-gia-nang-luc'],
    },
    { key: 'math_12', title: 'Tài liệu toán 12', tagSlugs: ['tai-lieu-toan-12'] },
    { key: 'math_11', title: 'Tài liệu toán 11', tagSlugs: ['tai-lieu-toan-11'] },
    { key: 'math_10', title: 'Tài liệu toán 10', tagSlugs: ['tai-lieu-toan-10'] },
  ],
  thcs: [
    { key: 'latest', title: 'Tài liệu mới nhất' },
    {
      key: 'grade_10_exam_review',
      title: 'Ôn thi vào lớp 10 môn toán',
      tagSlugs: ['de-thi-vao-lop-10', 'tai-lieu-thi-vao-lop-10'],
    },
    { key: 'math_9', title: 'Tài liệu toán 9', tagSlugs: ['tai-lieu-toan-9'] },
    { key: 'math_8', title: 'Tài liệu toán 8', tagSlugs: ['tai-lieu-toan-8'] },
    { key: 'math_7', title: 'Tài liệu toán 7', tagSlugs: ['tai-lieu-toan-7'] },
    { key: 'math_6', title: 'Tài liệu toán 6', tagSlugs: ['tai-lieu-toan-6'] },
  ],
}

@Injectable()
export class GetPublicSeoDocumentsByLevelUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
  ) {}

  async execute(levelSlug: LevelSlug): Promise<BaseResponseDto<DocumentSeoLevelResponseDto>> {
    const levelTag = await this.unitOfWork.executeInTransaction((repos) =>
      repos.tagRepository.findBySlug(levelSlug),
    )

    if (!levelTag || levelTag.type !== TagType.LEVEL) {
      throw new NotFoundException('Khong tim thay cap hoc')
    }

    const sections = await Promise.all(
      LEVEL_SECTION_CONFIGS[levelSlug].map((section) =>
        this.buildSection(levelTag.tagId, section),
      ),
    )

    return BaseResponseDto.success(
      'Lay danh sach tai lieu theo cap hoc thanh cong',
      DocumentSeoLevelResponseDto.fromData({
        level: DocumentTagResponseDto.fromEntity(levelTag),
        sections,
      }),
    )
  }

  private async buildSection(
    levelTagId: number,
    section: LevelSectionConfig,
  ): Promise<DocumentSeoSectionResponseDto> {
    const tagIds = section.tagSlugs?.length
      ? await this.resolveTagIds(section.tagSlugs)
      : undefined

    if (section.tagSlugs?.length && (!tagIds || tagIds.length === 0)) {
      return DocumentSeoSectionResponseDto.fromData({
        key: section.key,
        title: section.title,
        documents: [],
      })
    }

    const query = Object.assign(new DocumentListQueryDto(), {
      page: 1,
      limit: SECTION_LIMIT,
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
      visibility: Visibility.PUBLISHED,
      includeTags: true,
      tagIds,
    })

    const response = await this.getDocumentsUseCase.execute(query, {
      requiredTagId: levelTagId,
    })

    return DocumentSeoSectionResponseDto.fromData({
      key: section.key,
      title: section.title,
      documents: response.data,
    })
  }

  private async resolveTagIds(slugs: string[]): Promise<number[]> {
    const tags = await this.unitOfWork.executeInTransaction(async (repos) =>
      Promise.all(slugs.map((slug) => repos.tagRepository.findBySlug(slug))),
    )

    return tags
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
      .map((tag) => tag.tagId)
  }
}
