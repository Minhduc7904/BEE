// src/application/use-cases/course/get-student-course-detail.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentCourseDetailResponseDto } from '../../dtos/course/student-course-detail.dto'
import { 
    NotFoundException, 
    ForbiddenException,
    ConflictException 
} from '../../../shared/exceptions/custom-exceptions'
import { CourseVisibility } from 'src/shared/enums'
@Injectable()
export class GetStudentCourseDetailUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    ) { }
    
    async execute(
        courseId: number, 
        studentId: number
    ): Promise<BaseResponseDto<StudentCourseDetailResponseDto>> {
        // 1. Kiểm tra course có tồn tại không
        const course = await this.courseRepository.findById(courseId)

        if (!course) {
            throw new NotFoundException('Không tìm thấy khóa học')
        }

        // 2. Kiểm tra course có phải DRAFT không
        if (course.visibility === CourseVisibility.DRAFT) {
            throw new ConflictException('Khóa học này chưa được công bố')
        }

        // 3. Kiểm tra student đã enroll chưa
        const enrollment = await this.courseEnrollmentRepository.findByCourseAndStudent(
            courseId, 
            studentId
        )

        if (!enrollment || !enrollment.isActive()) {
            throw new ForbiddenException('Bạn chưa đăng ký khóa học này')
        }

        // 4. Tạo response với thông tin enrollment
        const courseResponse = StudentCourseDetailResponseDto.fromEntity(course, {
            isEnrolled: true,
            enrolledAt: enrollment.enrolledAt,
            status: enrollment.status,
        })

        return {
            success: true,
            message: 'Lấy thông tin khóa học thành công',
            data: courseResponse,
        }
    }
}
