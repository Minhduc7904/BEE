import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreateChapterDto, ChapterResponseDto } from '../../dtos'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class CreateChapterUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: CreateChapterDto,
    adminId: number,
  ): Promise<BaseResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository
      const subjectRepository = repos.subjectRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra subject có tồn tại không
      const subject = await subjectRepository.findById(dto.subjectId)
      if (!subject) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.CHAPTER.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.CHAPTER,
          errorMessage: `Không tìm thấy môn học với ID ${dto.subjectId}`,
        })
        throw new NotFoundException(`Không tìm thấy môn học với ID ${dto.subjectId}`)
      }

      // Kiểm tra parent chapter nếu có
      if (dto.parentChapterId) {
        const parentChapter = await chapterRepository.findById(dto.parentChapterId)
        if (!parentChapter) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.CHAPTER.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CHAPTER,
            errorMessage: `Không tìm thấy chương cha với ID ${dto.parentChapterId}`,
          })
          throw new NotFoundException(`Không tìm thấy chương cha với ID ${dto.parentChapterId}`)
        }
      }

      // Kiểm tra slug đã tồn tại chưa
      const existingBySlug = await chapterRepository.findBySlug(dto.slug)
      if (existingBySlug) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.CHAPTER.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.CHAPTER,
          errorMessage: `Slug '${dto.slug}' đã tồn tại`,
        })
        throw new ConflictException(`Slug '${dto.slug}' đã tồn tại`)
      }

      // Tạo chapter mới
      const chapter = await chapterRepository.create({
        subjectId: dto.subjectId,
        name: dto.name,
        code: dto.code,
        slug: dto.slug,
        parentChapterId: dto.parentChapterId,
        orderInParent: dto.orderInParent,
        level: dto.level || (dto.parentChapterId ? 1 : 0),
      })

      const response = ChapterResponseDto.fromChapter(chapter)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.CHAPTER.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.CHAPTER,
        resourceId: chapter.chapterId.toString(),
        afterData: {
          name: chapter.name,
          slug: chapter.slug,
          subjectId: chapter.subjectId,
        },
      })

      return response
    })

    return BaseResponseDto.success('Tạo chương thành công', result)
  }
}
