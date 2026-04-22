import { Inject, Injectable } from '@nestjs/common'
import { ChapterResponseDto, PaginationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'
import { Visibility } from '../../../shared/enums'

@Injectable()
export class GetPublicStudentChaptersBySubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) { }

  async execute(
    subjectId: number,
    page: number = 1,
    limit: number = 100,
    search?: string,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subject = await repos.subjectRepository.findById(subjectId)
      if (!subject) {
        throw new NotFoundException(`Không tìm thấy môn học với ID ${subjectId}`)
      }

      const normalizedPage = Math.max(1, page || 1)
      const normalizedLimit = Math.max(1, limit || 100)
      const normalizedSearch = this.normalizeSearchText(search)

      const allChapters = await repos.chapterRepository.findBySubjectId(subjectId)
      const filteredChapters = normalizedSearch
        ? allChapters.filter((chapter) => this.matchesSearch(chapter.name, chapter.slug, normalizedSearch))
        : allChapters
      const sortedChapters = filteredChapters.slice().sort((a, b) => a.chapterId - b.chapterId)

      const skip = (normalizedPage - 1) * normalizedLimit
      const data = sortedChapters.slice(skip, skip + normalizedLimit)
      const total = sortedChapters.length

      const chapterDtos = ChapterResponseDto.fromChapterList(data)
      const chaptersWithQuestionCount: ChapterResponseDto[] = await Promise.all(
        chapterDtos.map(async (chapterDto) => {
          const questionResult = await repos.questionRepository.findAllWithPagination(
            {
              page: 1,
              limit: 1,
            },
            {
              chapterIds: [chapterDto.chapterId],
              // visibility: Visibility.PUBLISHED,
            },
          )

          return {
            ...chapterDto,
            questionCount: questionResult.total,
          }
        }),
      )

      return {
        data: chaptersWithQuestionCount,
        total,
        page: normalizedPage,
        limit: normalizedLimit,
      }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách chương theo môn học thành công',
      result.data,
      result.page,
      result.limit,
      result.total,
    )
  }

  private normalizeSearchText(value?: string): string | undefined {
    if (!value) return undefined

    const trimmed = value.trim()
    if (!trimmed) return undefined

    return TextSearchUtil.removeVietnameseAccents(trimmed).toLowerCase()
  }

  private matchesSearch(name: string, slug: string, normalizedSearch: string): boolean {
    const normalizedName = TextSearchUtil.removeVietnameseAccents(name).toLowerCase()
    const normalizedSlug = TextSearchUtil.removeVietnameseAccents(slug).toLowerCase()

    return normalizedName.includes(normalizedSearch) || normalizedSlug.includes(normalizedSearch)
  }
}