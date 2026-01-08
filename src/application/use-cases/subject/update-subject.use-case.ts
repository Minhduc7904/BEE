import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, UpdateSubjectDto, SubjectResponseDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class UpdateSubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    id: number,
    dto: UpdateSubjectDto,
    adminId: number,
  ): Promise<BaseResponseDto<SubjectResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subjectRepository = repos.subjectRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra môn học có tồn tại không
      const existingSubject = await subjectRepository.findById(id)
      if (!existingSubject) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.SUBJECT.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.SUBJECT,
          resourceId: id.toString(),
          errorMessage: `Không tìm thấy môn học với ID ${id}`,
        })
        throw new NotFoundException(`Không tìm thấy môn học với ID ${id}`)
      }

      // Kiểm tra tên mới có trùng với môn học khác không
      if (dto.name && dto.name !== existingSubject.name) {
        const duplicateName = await subjectRepository.findByName(dto.name)
        if (duplicateName && duplicateName.subjectId !== id) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.SUBJECT.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SUBJECT,
            resourceId: id.toString(),
            errorMessage: `Môn học '${dto.name}' đã tồn tại`,
          })
          throw new ConflictException(`Môn học '${dto.name}' đã tồn tại`)
        }
      }

      // Kiểm tra code mới nếu có
      if (dto.code && dto.code !== existingSubject.code) {
        const duplicateCode = await subjectRepository.findByCode(dto.code)
        if (duplicateCode && duplicateCode.subjectId !== id) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.SUBJECT.UPDATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SUBJECT,
            resourceId: id.toString(),
            errorMessage: `Mã môn học '${dto.code}' đã tồn tại`,
          })
          throw new ConflictException(`Mã môn học '${dto.code}' đã tồn tại`)
        }
      }

      // Cập nhật môn học
      const beforeData = {
        name: existingSubject.name,
        code: existingSubject.code,
      }

      const updated = await subjectRepository.update(id, {
        name: dto.name,
        code: dto.code,
      })

      const response = SubjectResponseDto.fromSubject(updated)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.SUBJECT.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.SUBJECT,
        resourceId: id.toString(),
        beforeData,
        afterData: {
          name: updated.name,
          code: updated.code,
        },
      })

      return response
    })

    return BaseResponseDto.success('Cập nhật môn học thành công', result)
  }
}
