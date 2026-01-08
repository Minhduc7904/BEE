import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeleteChapterUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number, adminId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const chapterRepository = repos.chapterRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra chapter có tồn tại không
      const existingChapter = await chapterRepository.findById(id)
      if (!existingChapter) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.CHAPTER.DELETE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.CHAPTER,
          resourceId: id.toString(),
          errorMessage: `Không tìm thấy chương với ID ${id}`,
        })
        throw new NotFoundException(`Không tìm thấy chương với ID ${id}`)
      }

      const beforeData = {
        name: existingChapter.name,
        slug: existingChapter.slug,
        subjectId: existingChapter.subjectId,
      }

      // Xóa chapter
      await chapterRepository.delete(id)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.CHAPTER.DELETE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.CHAPTER,
        resourceId: id.toString(),
        beforeData,
      })

      return { deleted: true }
    })

    return BaseResponseDto.success('Xóa chương thành công', result)
  }
}
