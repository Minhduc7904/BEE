// src/application/use-cases/course/create-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateCourseDto } from '../../dtos/course/create-course.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { CourseVisibility } from 'src/shared/enums'

@Injectable()
export class CreateCourseUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork
    ) { }

    async execute(
        dto: CreateCourseDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CourseResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const courseRepository = repos.courseRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Validate compareAt price
            if (dto.compareAtVND && dto.compareAtVND <= dto.priceVND) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.COURSE.CREATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.COURSE,
                        errorMessage: 'Giá gốc phải lớn hơn giá bán',
                    })
                }
                throw new ConflictException('Giá gốc phải lớn hơn giá bán')
            }

            const createData = {
                title: dto.title,
                subtitle: dto.subtitle,
                academicYear: dto.academicYear,
                grade: dto.grade,
                subjectId: dto.subjectId,
                description: dto.description,
                priceVND: dto.priceVND,
                compareAtVND: dto.compareAtVND,
                visibility: dto.visibility || CourseVisibility.DRAFT,
                teacherId: dto.teacherId,
            }

            const course = await courseRepository.create(createData)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COURSE.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COURSE,
                    resourceId: course.courseId.toString(),
                    afterData: {
                        title: course.title,
                        grade: course.grade,
                        visibility: course.visibility,
                    },
                })
            }

            return CourseResponseDto.fromEntity(course)
        })

        return {
            success: true,
            message: 'Tạo khóa học thành công',
            data: result,
        }
    }
}
