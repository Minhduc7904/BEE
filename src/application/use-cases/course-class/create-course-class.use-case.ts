import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { CourseClassResponseDto } from '../../dtos/course-class/course-class.dto';
import { CreateCourseClassDto } from '../../dtos/course-class/create-course-class.dto';
import { CreateCourseClassData } from 'src/domain/interface/course-class/course-class.interface';
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class CreateCourseClassUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: CreateCourseClassDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseClassRepository = repos.courseClassRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Validate date logic
            if (dto.startDate && dto.endDate) {
                const startDate = new Date(dto.startDate);
                const endDate = new Date(dto.endDate);

                if (endDate <= startDate) {
                    if (adminId) {
                        await adminAuditLogRepository.create({
                            adminId,
                            actionKey: ACTION_KEYS.COURSE_CLASS.CREATE,
                            status: AuditStatus.FAIL,
                            resourceType: RESOURCE_TYPES.COURSE_CLASS,
                            errorMessage: 'Ngày kết thúc phải sau ngày bắt đầu',
                        })
                    }
                    throw new ConflictException(
                        'Ngày kết thúc phải sau ngày bắt đầu',
                    );
                }
            }

            const data: CreateCourseClassData = {
                courseId: dto.courseId,
                className: dto.className,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                room: dto.room,
                instructorId: dto.instructorId,
            };

            const courseClass = await courseClassRepository.create(data);

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE_CLASS.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE_CLASS,
                    resourceId: courseClass.classId.toString(),
                    afterData: {
                        courseId: courseClass.courseId,
                        className: courseClass.className,
                    },
                })
            }

            return new CourseClassResponseDto(courseClass)
        })

        return BaseResponseDto.success('Tạo lớp học thành công', result)
    }
}
