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
export class DeleteCourseEnrollmentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(
    enrollmentId: number,
    adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const courseEnrollmentRepository = repos.courseEnrollmentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const enrollment = await courseEnrollmentRepository.findById(
        enrollmentId,
      );

      if (!enrollment) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.DELETE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
            resourceId: enrollmentId.toString(),
            errorMessage: `Không tìm thấy đăng ký khóa học với ID ${enrollmentId}`,
          })
        }
        throw new NotFoundException(
          `Không tìm thấy đăng ký khóa học với ID ${enrollmentId}`,
        );
      }

      await courseEnrollmentRepository.delete(enrollmentId);

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.COURSE_ENROLLMENT.DELETE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
          resourceId: enrollmentId.toString(),
          beforeData: {
            courseId: enrollment.courseId,
            studentId: enrollment.studentId,
            status: enrollment.status,
          },
        })
      }

      return null
    })

    return new BaseResponseDto(
      true,
      'Xóa đăng ký khóa học thành công',
      result,
    );
  }
}
