// src/application/use-cases/course/delete-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'

@Injectable()
export class DeleteCourseUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork
    ) { }

    async execute(
        courseId: number,
        adminId?: number,
    ): Promise<BaseResponseDto<null>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseRepository = repos.courseRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const course = await courseRepository.findById(courseId)

            if (!course) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE.DELETE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE,
                        resourceId: courseId.toString(),
                        errorMessage: 'Không tìm thấy khóa học',
                    })
                }
                throw new NotFoundException('Không tìm thấy khóa học')
            }

            await courseRepository.delete(courseId)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE,
                    resourceId: courseId.toString(),
                    beforeData: {
                        title: course.title,
                        grade: course.grade,
                        visibility: course.visibility,
                    },
                })
            }

            return null
        })

        return {
            success: true,
            message: 'Xóa khóa học thành công',
            data: result,
        }
    }
}
