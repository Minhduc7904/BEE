import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, CreateTeacherProfileDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { TeacherProfileSeoAiService } from 'src/infrastructure/services'
import { generateUniqueTeacherProfileSlug } from './teacher-profile-slug.util'

@Injectable()
export class CreateTeacherProfileUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly teacherProfileSeoAiService: TeacherProfileSeoAiService,
  ) {}

  async execute(
    dto: CreateTeacherProfileDto,
    userId?: number,
  ): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const seoFields = this.shouldGenerateSeo(dto)
      ? await this.teacherProfileSeoAiService.generate({
          displayName: dto.displayName,
          headline: dto.headline,
          shortDescription: dto.shortDescription,
          bio: dto.bio,
          expertise: dto.expertise,
          teachingSubjects: dto.teachingSubjects,
          gradeLevels: dto.gradeLevels,
          teachingFormats: dto.teachingFormats,
          teachingMethods: dto.teachingMethods,
          yearsExperience: dto.yearsExperience,
          education: dto.education,
          certifications: dto.certifications,
          achievements: dto.achievements,
          teachingArea: dto.teachingArea,
          workplace: dto.workplace,
        })
      : null

    const teacherProfile = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { slug: inputSlug, ...createData } = dto
      const slug = await generateUniqueTeacherProfileSlug(
        inputSlug || dto.displayName,
        repos.teacherProfileRepository,
      )

      return repos.teacherProfileRepository.create({
        ...createData,
        targetKeyword: dto.targetKeyword || seoFields?.targetKeyword,
        keywordText: dto.keywordText || seoFields?.keywordText,
        metaTitle: dto.metaTitle || seoFields?.metaTitle,
        metaDescription: dto.metaDescription || seoFields?.metaDescription,
        ogTitle: dto.ogTitle || seoFields?.ogTitle,
        ogDescription: dto.ogDescription || seoFields?.ogDescription,
        searchIntent: dto.searchIntent || seoFields?.searchIntent,
        slug,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
    })

    return BaseResponseDto.success(
      'Tao ho so giao vien thanh cong',
      TeacherProfileResponseDto.fromEntity(teacherProfile),
    )
  }

  private shouldGenerateSeo(dto: CreateTeacherProfileDto): boolean {
    return (
      !dto.targetKeyword ||
      !dto.keywordText ||
      !dto.metaTitle ||
      !dto.metaDescription ||
      !dto.ogTitle ||
      !dto.ogDescription ||
      !dto.searchIntent
    )
  }
}
