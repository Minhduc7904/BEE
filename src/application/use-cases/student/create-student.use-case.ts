// src/application/use-cases/student/create-student.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import {
    RegisterStudentDto,
    StudentResponseDto,
    BaseResponseDto
} from '../../dtos'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'
import { PasswordService } from '../../../infrastructure/services'
import { ACTION_KEYS } from 'src/shared/constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { CourseEnrollmentStatus } from 'src/shared/enums'
import { AttendanceStatus } from 'src/shared/enums'

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    ) { }

    async execute(dto: RegisterStudentDto, createdBy: number): Promise<BaseResponseDto<StudentResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const userRepository = repos.userRepository;
            const studentRepository = repos.studentRepository;
            const courseRepository = repos.courseRepository;
            const courseEnrollmentRepository = repos.courseEnrollmentRepository;
            const courseClassRepository = repos.courseClassRepository;
            const classStudentRepository = repos.classStudentRepository;
            const classSessionRepository = repos.classSessionRepository;
            const attendanceRepository = repos.attendanceRepository;
            const adminAuditLogRepository = repos.adminAuditLogRepository;
            const roleRepository = repos.roleRepository;

            // Validate unique constraints
            const usernameExists = await userRepository.existsByUsername(dto.username)
            if (usernameExists) {
                throw new ConflictException('Username đã tồn tại')
            }

            if (dto.email) {
                const emailExists = await userRepository.existsByEmail(dto.email)
                if (emailExists) {
                    throw new ConflictException('Email đã tồn tại')
                }
            }

            if (dto.courseIds && dto.courseIds.length > 0) {
                const courses = await courseRepository.findByIds(dto.courseIds);
                if (courses.length !== dto.courseIds.length) {
                    throw new ConflictException('Một hoặc nhiều khóa học không tồn tại');
                }
                // Additional validations related to courses can be added here
            }

            if (dto.classIds && dto.classIds.length > 0) {
                const courseClasses = await courseClassRepository.findByIds(dto.classIds);
                if (courseClasses.length !== dto.classIds.length) {
                    throw new ConflictException('Một hoặc nhiều lớp học không tồn tại');
                }
                if (dto.courseIds?.length) {
                    const courseIds = dto.courseIds; // TS giờ chắc chắn là number[]

                    const invalidClasses = courseClasses.filter(
                        c => !courseIds.includes(c.courseId)
                    );

                    if (invalidClasses.length > 0) {
                        throw new ConflictException('Lớp học không thuộc khóa học đã chọn');
                    }
                }
                // Additional validations related to course classes can be added here
            }

            if (dto.sessionIds && dto.sessionIds.length > 0) {
                const classSessions = await classSessionRepository.findByIds(dto.sessionIds);
                if (classSessions.length !== dto.sessionIds.length) {
                    throw new ConflictException('Một hoặc nhiều buổi học không tồn tại');
                }
                // Additional validations related to class sessions can be added here
            }

            // Hash password
            const passwordHash = await this.passwordService.hashPassword(dto.password)

            // Create user (trong transaction)
            const user = await userRepository.create({
                username: dto.username,
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                gender: dto.gender,
                dateOfBirth: dto.dateOfBirth,
                isActive: true,
                isEmailVerified: false,
            })

            await roleRepository.assignRoleToUser(user.userId, 4);

            // Create student (trong cùng transaction)
            const student = await studentRepository.create({
                userId: user.userId,
                studentPhone: dto.studentPhone,
                parentPhone: dto.parentPhone,
                grade: dto.grade,
                school: dto.school,
            })

            if (dto.courseIds && dto.courseIds.length > 0) {
                await courseEnrollmentRepository.createBulk(
                    dto.courseIds.map(courseId => ({
                        studentId: student.studentId,
                        courseId,
                        status: CourseEnrollmentStatus.ACTIVE,
                    }))
                );
            }

            if (dto.classIds && dto.classIds.length > 0) {
                await classStudentRepository.createBulk(
                    dto.classIds.map(classId => ({
                        studentId: student.studentId,
                        classId,
                    }))
                );
            }

            if (dto.sessionIds && dto.sessionIds.length > 0) {
                await attendanceRepository.createBulk(
                    dto.sessionIds.map(sessionId => ({
                        studentId: student.studentId,
                        sessionId,
                        status: AttendanceStatus.PRESENT,
                    }))
                );
            }

            await adminAuditLogRepository.create({
                adminId: createdBy,
                actionKey: ACTION_KEYS.STUDENT.CREATE,
                status: AuditStatus.SUCCESS,
                resourceType: 'Student',
                resourceId: student.studentId.toString(),
                afterData: student,
            })

            // Fetch student with user details để trả về đầy đủ thông tin
            const studentWithUser = await studentRepository.findById(student.studentId)

            return BaseResponseDto.success(
                'Tạo học sinh thành công',
                StudentResponseDto.fromStudentEntity(studentWithUser),
            )
        })
    }
}
