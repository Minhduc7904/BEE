import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateAchievementBoardDto, AchievementBoardResponseDto } from 'src/application/dtos'
import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { AchievementBoardSeoAiService } from 'src/infrastructure/services'
import { generateUniqueAchievementBoardSlug } from './achievement-board-slug.util'

@Injectable()
export class CreateAchievementBoardUseCase {
  constructor(
    @Inject('IAchievementBoardRepository')
    private readonly achievementBoardRepository: IAchievementBoardRepository,
    private readonly achievementBoardSeoAiService: AchievementBoardSeoAiService,
  ) {}

  async execute(dto: CreateAchievementBoardDto, userId?: number): Promise<BaseResponseDto<AchievementBoardResponseDto>> {
    const seoFields = this.shouldGenerateSeo(dto)
      ? await this.achievementBoardSeoAiService.generate({
          title: dto.title,
          competitionName: dto.competitionName,
          academicYear: dto.academicYear,
          description: dto.description,
          shortDescription: dto.shortDescription,
        })
      : null

    const inputSlug = dto.slug
    const createData = { ...dto }
    delete createData.auto
    delete createData.slug
    const slug = await generateUniqueAchievementBoardSlug(
      inputSlug || `${dto.competitionName} ${dto.academicYear || ''} ${dto.title}`,
      this.achievementBoardRepository,
    )

    const board = await this.achievementBoardRepository.create({
      ...createData,
      targetKeyword: dto.targetKeyword || seoFields?.targetKeyword,
      keywordText: dto.keywordText || seoFields?.keywordText,
      metaTitle: dto.metaTitle || seoFields?.metaTitle,
      metaDescription: dto.metaDescription || seoFields?.metaDescription,
      ogTitle: dto.ogTitle || seoFields?.ogTitle,
      ogDescription: dto.ogDescription || seoFields?.ogDescription,
      searchIntent: dto.searchIntent || seoFields?.searchIntent,
      seoScore: dto.seoScore ?? seoFields?.seoScore,
      slug,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    })

    return BaseResponseDto.success('Tao bang thanh tich thanh cong', AchievementBoardResponseDto.fromEntity(board))
  }

  private shouldGenerateSeo(dto: CreateAchievementBoardDto): boolean {
    if (dto.auto === false) {
      return false
    }

    return (
      !dto.targetKeyword ||
      !dto.keywordText ||
      !dto.metaTitle ||
      !dto.metaDescription ||
      !dto.ogTitle ||
      !dto.ogDescription ||
      !dto.searchIntent ||
      dto.seoScore === undefined
    )
  }
}
