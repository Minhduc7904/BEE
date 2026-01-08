import {
    Inject,
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository';
import { CreateCourseEnrollmentDto } from '../../dtos/course-enrollment/create-course-enrollment.dto';
import { CourseEnrollmentResponseDto } from '../../dtos/course-enrollment/course-enrollment.dto';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import type { ICourseRepository, IStudentRepository } from 'src/domain/repositories';
import { EnrollmentStatus } from 'src/domain/entities/course-enrollment/course-enrollment.entity';

@Injectable()
export class CreateCourseEnrollmentUseCase {
    constructor(
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(
        createDto: CreateCourseEnrollmentDto,
    ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
        // Check if course exists
        const course = await this.courseRepository.findById(createDto.courseId);
        if (!course) {
            throw new NotFoundException(
                `Không tìm thấy khóa học với ID ${createDto.courseId}`,
            );
        }

        // Check if student exists
        const student = await this.studentRepository.findById(createDto.studentId);
        if (!student) {
            throw new NotFoundException(
                `Không tìm thấy học sinh với ID ${createDto.studentId}`,
            );
        }

        // Check if enrollment already exists
        const existingEnrollment =
            await this.courseEnrollmentRepository.findByCourseAndStudent(
                createDto.courseId,
                createDto.studentId,
            );
        if (existingEnrollment) {
            throw new ConflictException(
                `Học sinh đã đăng ký khóa học này rồi`,
            );
        }

        const enrollment = await this.courseEnrollmentRepository.create({
            courseId: createDto.courseId,
            studentId: createDto.studentId,
            status: createDto.status || EnrollmentStatus.ACTIVE,
        });

        const enrollmentDto = new CourseEnrollmentResponseDto(enrollment);

        return new BaseResponseDto(
            true,
            'Đăng ký khóa học thành công',
            enrollmentDto,
        );
    }
}
