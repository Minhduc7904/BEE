import { Injectable, Inject } from '@nestjs/common'
import { BaseResponseDto, CreateSubjectDto, SubjectResponseDto } from '../../dtos'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class CreateSubjectUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: CreateSubjectDto,
    adminId: number,
  ): Promise<BaseResponseDto<SubjectResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const subjectRepository = repos.subjectRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Kiểm tra tên môn học đã tồn tại chưa
      const existingByName = await subjectRepository.findByName(dto.name)
      if (existingByName) {
        await adminAuditLogRepository.create({
          adminId: adminId,
          actionKey: ACTION_KEYS.SUBJECT.CREATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.SUBJECT,
          errorMessage: `Môn học '${dto.name}' đã tồn tại`,
        })
        throw new ConflictException(`Môn học '${dto.name}' đã tồn tại`)
      }

      // Kiểm tra code nếu có
      if (dto.code) {
        const existingByCode = await subjectRepository.findByCode(dto.code)
        if (existingByCode) {
          await adminAuditLogRepository.create({
            adminId: adminId,
            actionKey: ACTION_KEYS.SUBJECT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.SUBJECT,
            errorMessage: `Mã môn học '${dto.code}' đã tồn tại`,
          })
          throw new ConflictException(`Mã môn học '${dto.code}' đã tồn tại`)
        }
      }

      // Tạo môn học mới
      const subject = await subjectRepository.create({
        name: dto.name,
        code: dto.code,
      })

      const response = SubjectResponseDto.fromSubject(subject)

      await adminAuditLogRepository.create({
        adminId: adminId,
        actionKey: ACTION_KEYS.SUBJECT.CREATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.SUBJECT,
        resourceId: subject.subjectId.toString(),
        afterData: {
          name: subject.name,
          code: subject.code,
        },
      })

      return response
    })

    return BaseResponseDto.success('Tạo môn học thành công', result)
  }
}
