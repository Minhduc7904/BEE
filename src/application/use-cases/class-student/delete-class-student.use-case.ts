import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class DeleteClassStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    classId: number,
    studentId: number,
    adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const classStudentRepository = repos.classStudentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Check if class student exists
      const exists = await classStudentRepository.exists(
        classId,
        studentId,
      );
      if (!exists) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.CLASS_STUDENT.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.CLASS_STUDENT,
            errorMessage: `Không tìm thấy học sinh trong lớp học này`,
          })
        }
        throw new NotFoundException(
          `Không tìm thấy học sinh trong lớp học này`,
        );
      }

      await classStudentRepository.delete(classId, studentId);

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.CLASS_STUDENT.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.CLASS_STUDENT,
          beforeData: {
            classId,
            studentId,
          },
        })
      }

      return null
    })

    return new BaseResponseDto(
      true,
      'Xóa học sinh khỏi lớp học thành công',
      result,
    );
  }
}
