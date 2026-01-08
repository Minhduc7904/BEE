import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, UpdateChapterDto, ChapterResponseDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateChapterUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    id: number,
    dto: UpdateChapterDto,
    adminId: number,
  ): Promise<BaseResponseDto<ChapterResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository
      const subjectRepository = repos.subjectRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra chapter có tồn tại không
      const existingChapter = await chapterRepository.findById(id)
      if (!existingChapter) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.CHAPTER.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.CHAPTER,
          resourceId: id.toString(),
          errorMessage: `Không tìm thấy chương với ID ${id}`,
        })
        throw new NotFoundException(`Không tìm thấy chương với ID ${id}`)
      }

      // Kiểm tra subject nếu thay đổi
      if (dto.subjectId && dto.subjectId !== existingChapter.subjectId) {
        const subject = await subjectRepository.findById(dto.subjectId)
        if (!subject) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.CHAPTER.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CHAPTER,
            resourceId: id.toString(),
            errorMessage: `Không tìm thấy môn học với ID ${dto.subjectId}`,
          })
          throw new NotFoundException(`Không tìm thấy môn học với ID ${dto.subjectId}`)
        }
      }

      // Kiểm tra slug mới nếu có
      if (dto.slug && dto.slug !== existingChapter.slug) {
        const duplicateSlug = await chapterRepository.findBySlug(dto.slug)
        if (duplicateSlug && duplicateSlug.chapterId !== id) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.CHAPTER.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CHAPTER,
            resourceId: id.toString(),
            errorMessage: `Slug '${dto.slug}' đã tồn tại`,
          })
          throw new ConflictException(`Slug '${dto.slug}' đã tồn tại`)
        }
      }

      // Cập nhật chapter
      const beforeData = {
        name: existingChapter.name,
        slug: existingChapter.slug,
        subjectId: existingChapter.subjectId,
        parentChapterId: existingChapter.parentChapterId,
      }

      const updated = await chapterRepository.update(id, {
        subjectId: dto.subjectId,
        name: dto.name,
        code: dto.code,
        slug: dto.slug,
        parentChapterId: dto.parentChapterId,
        orderInParent: dto.orderInParent,
        level: dto.level,
      })

      const response = ChapterResponseDto.fromChapter(updated)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.CHAPTER.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.CHAPTER,
        resourceId: id.toString(),
        beforeData,
        afterData: {
          name: updated.name,
          slug: updated.slug,
          subjectId: updated.subjectId,
          parentChapterId: updated.parentChapterId,
        },
      })

      return response
    })

    return BaseResponseDto.success('Cập nhật chương thành công', result)
  }
}
