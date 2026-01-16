import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class DeleteCourseClassUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        classId: number,
        adminId?: number,
    ): Promise<BaseResponseDto<null>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseClassRepository = repos.courseClassRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Check if course class exists
            const courseClass = await courseClassRepository.findById(classId);
            if (!courseClass) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE_CLASS.DELETE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE_CLASS,
                        resourceId: classId.toString(),
                        errorMessage: `Lớp học với ID ${classId} không tồn tại`,
                    })
                }
                throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
            }

            await courseClassRepository.delete(classId);

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE_CLASS.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE_CLASS,
                    resourceId: classId.toString(),
                    beforeData: {
                        courseId: courseClass.courseId,
                        className: courseClass.className,
                    },
                })
            }

            return null
        })

        return BaseResponseDto.success('Xóa lớp học thành công', result)
    }
}
