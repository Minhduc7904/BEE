import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { UpdateCourseEnrollmentDto } from 'src/application/dtos/course-enrollment/update-course-enrollment.dto';
import { CourseEnrollmentResponseDto } from 'src/application/dtos/course-enrollment/course-enrollment.dto';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { CourseEnrollmentStatus } from 'src/shared/enums';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class UpdateCourseEnrollmentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        enrollmentId: number,
        updateDto: UpdateCourseEnrollmentDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
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
                        actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
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

            // Validate status transition
            if (updateDto.status) {
                const validStatuses = Object.values(CourseEnrollmentStatus);
                if (!validStatuses.includes(updateDto.status as CourseEnrollmentStatus)) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
                            resourceId: enrollmentId.toString(),
                            errorMessage: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`,
                        })
                    }
                    throw new BadRequestException(
                        `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`,
                    );
                }

                // If trying to complete, check if can complete
                if (updateDto.status === CourseEnrollmentStatus.COMPLETED && !enrollment.canComplete()) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
                            resourceId: enrollmentId.toString(),
                            errorMessage: 'Không thể hoàn thành đăng ký đã bị hủy',
                        })
                    }
                    throw new BadRequestException(
                        'Không thể hoàn thành đăng ký đã bị hủy',
                    );
                }

                // If trying to cancel, check if can cancel
                if (updateDto.status === CourseEnrollmentStatus.CANCELLED && !enrollment.canCancel()) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
                            resourceId: enrollmentId.toString(),
                            errorMessage: 'Không thể hủy đăng ký đã hoàn thành',
                        })
                    }
                    throw new BadRequestException(
                        'Không thể hủy đăng ký đã hoàn thành',
                    );
                }
            }

            const updatedEnrollment = await courseEnrollmentRepository.update(
                enrollmentId,
                updateDto,
            );

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE_ENROLLMENT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
                    resourceId: updatedEnrollment.enrollmentId.toString(),
                    beforeData: {
                        status: enrollment.status,
                    },
                    afterData: {
                        status: updatedEnrollment.status,
                    },
                })
            }

            return new CourseEnrollmentResponseDto(updatedEnrollment)
        })

        return new BaseResponseDto(
            true,
            'Cập nhật đăng ký khóa học thành công',
            result,
        )
    }
}
