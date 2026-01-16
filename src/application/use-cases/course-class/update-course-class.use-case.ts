import { Inject, Injectable } from '@nestjs/common';
import type { IUnitOfWork } from 'src/domain/repositories';
import { CourseClassResponseDto } from 'src/application/dtos/course-class/course-class.dto';
import { UpdateCourseClassDto } from '../../dtos/course-class/update-course-class.dto';
import { UpdateCourseClassData } from 'src/domain/interface/course-class/course-class.interface';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants';
import { AuditStatus } from 'src/shared/enums/audit-status.enum';
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants';

@Injectable()
export class UpdateCourseClassUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        classId: number,
        dto: UpdateCourseClassDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseClassRepository = repos.courseClassRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Check if course class exists
            const existingClass = await courseClassRepository.findById(classId);
            if (!existingClass) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE_CLASS,
                        resourceId: classId.toString(),
                        errorMessage: `Lớp học với ID ${classId} không tồn tại`,
                    })
                }
                throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
            }

            // Validate date logic
            const startDate = dto.startDate
                ? new Date(dto.startDate)
                : existingClass.startDate;
            const endDate = dto.endDate ? new Date(dto.endDate) : existingClass.endDate;

            if (startDate && endDate && endDate <= startDate) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE_CLASS,
                        resourceId: classId.toString(),
                        errorMessage: 'Ngày kết thúc phải sau ngày bắt đầu',
                    })
                }
                throw new ConflictException(
                    'Ngày kết thúc phải sau ngày bắt đầu',
                );
            }

            const data: UpdateCourseClassData = {
                className: dto.className,
                startDate: dto.startDate
                    ? new Date(dto.startDate)
                    : dto.startDate === null
                        ? null
                        : undefined,
                endDate: dto.endDate
                    ? new Date(dto.endDate)
                    : dto.endDate === null
                        ? null
                        : undefined,
                room: dto.room,
                instructorId: dto.instructorId,
            };

            const courseClass = await courseClassRepository.update(classId, data);

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE_CLASS,
                    resourceId: courseClass.classId.toString(),
                    beforeData: {
                        className: existingClass.className,
                        room: existingClass.room,
                    },
                    afterData: {
                        className: courseClass.className,
                        room: courseClass.room,
                    },
                })
            }

            return new CourseClassResponseDto(courseClass)
        })

        return BaseResponseDto.success('Cập nhật lớp học thành công', result)
    }
}
