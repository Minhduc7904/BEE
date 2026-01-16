import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateCourseEnrollmentDto } from '../../dtos/course-enrollment/create-course-enrollment.dto'
import { CourseEnrollmentResponseDto } from '../../dtos/course-enrollment/course-enrollment.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseEnrollmentStatus } from 'src/shared/enums'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class CreateCourseEnrollmentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    createDto: CreateCourseEnrollmentDto,
    isStudent: boolean,
    adminId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const courseEnrollmentRepository = repos.courseEnrollmentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      if (!createDto.studentId) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
            errorMessage: 'ID học sinh không được để trống',
          })
        }
        throw new ConflictException('ID học sinh không được để trống')
      }

      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { courseId: createDto.courseId },
      })
      if (!course) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
            errorMessage: `Không tìm thấy khóa học với ID ${createDto.courseId}`,
          })
        }
        throw new NotFoundException(`Không tìm thấy khóa học với ID ${createDto.courseId}`)
      }

      // Check if student exists
      const student = await this.prisma.student.findUnique({
        where: { studentId: createDto.studentId },
      })
      if (!student) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
            errorMessage: `Không tìm thấy học sinh với ID ${createDto.studentId}`,
          })
        }
        throw new NotFoundException(`Không tìm thấy học sinh với ID ${createDto.studentId}`)
      }

      // Check if enrollment already exists
      const existingEnrollment = await courseEnrollmentRepository.findByCourseAndStudent(
        createDto.courseId,
        createDto.studentId,
      )
      if (existingEnrollment) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.COURSE_ENROLLMENT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
            errorMessage: 'Học sinh đã đăng ký khóa học này rồi',
          })
        }
        throw new ConflictException('Học sinh đã đăng ký khóa học này rồi')
      }

      const enrollment = await courseEnrollmentRepository.create({
        courseId: createDto.courseId,
        studentId: createDto.studentId,
        status: createDto.status || CourseEnrollmentStatus.ACTIVE,
      })

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.COURSE_ENROLLMENT.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.COURSE_ENROLLMENT,
          resourceId: enrollment.enrollmentId.toString(),
          afterData: {
            courseId: enrollment.courseId,
            studentId: enrollment.studentId,
            status: enrollment.status,
          },
        })
      }

      return new CourseEnrollmentResponseDto(enrollment)
    })

    return new BaseResponseDto(true, 'Đăng ký khóa học thành công', result)
  }
}
