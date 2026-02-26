// src/application/use-cases/lesson/get-student-course-lessons.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import type { ICourseRepository } from '../../../domain/repositories'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLessonResponseDto } from '../../dtos/lesson/student-lesson.dto'
import { 
    NotFoundException, 
    ForbiddenException,
    ConflictException 
} from '../../../shared/exceptions/custom-exceptions'
import { CourseVisibility } from 'src/shared/enums'

@Injectable()
export class GetStudentCourseLessonsUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository,
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
    ) { }
    
    async execute(
        courseId: number, 
        studentId: number
    ): Promise<BaseResponseDto<StudentLessonResponseDto[]>> {
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

        // 4. Lấy tất cả lessons (không bao gồm DRAFT) với chapters và learningItems
        const lessons = await this.lessonRepository.findByCourseForStudent(courseId)

        // 5. Lấy tất cả learning item IDs từ lessons
        const learningItemIds: number[] = []
        lessons.forEach(lesson => {
            lesson.learningItems?.forEach(li => {
                if (li.learningItem?.learningItemId) {
                    learningItemIds.push(li.learningItem.learningItemId)
                }
            })
        })

        // 6. Lấy student learning items progress
        const studentLearningItemsList = learningItemIds.length > 0
            ? await this.studentLearningItemRepository.findByStudentAndItems(studentId, learningItemIds)
            : []

        // 7. Tạo Map để tra cứu nhanh
        const studentLearningItemsMap = new Map(
            studentLearningItemsList.map(sli => [sli.learningItemId, sli])
        )

        // 8. Map to response DTOs với progress
        const lessonResponses = StudentLessonResponseDto.fromEntities(lessons, studentLearningItemsMap)

        return {
            success: true,
            message: 'Lấy danh sách bài học thành công',
            data: lessonResponses,
        }
    }
}
