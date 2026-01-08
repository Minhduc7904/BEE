import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeleteSubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(id: number, adminId: number): Promise<BaseResponseDto<{ deleted: boolean }>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subjectRepository = repos.subjectRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra môn học có tồn tại không
      const existingSubject = await subjectRepository.findById(id)
      if (!existingSubject) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.SUBJECT.DELETE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.SUBJECT,
          resourceId: id.toString(),
          errorMessage: `Không tìm thấy môn học với ID ${id}`,
        })
        throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`)
      }

      const beforeData = {
        name: existingSubject.name,
        code: existingSubject.code,
      }

      // Xóa môn học
      await subjectRepository.delete(id)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.SUBJECT.DELETE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.SUBJECT,
        resourceId: id.toString(),
        beforeData,
      })

      return { deleted: true }
    })

    return BaseResponseDto.success('Xóa môn học thành công', result)
  }
}
