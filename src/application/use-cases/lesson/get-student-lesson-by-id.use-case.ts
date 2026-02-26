// src/application/use-cases/lesson/get-student-lesson-by-id.use-case.ts
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
import { Visibility } from '../../../shared/enums'

@Injectable()
export class GetStudentLessonByIdUseCase {
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
        lessonId: number, 
        studentId: number
    ): Promise<BaseResponseDto<StudentLessonResponseDto>> {
        // 1. Kiểm tra lesson có tồn tại không
        const lesson = await this.lessonRepository.findById(lessonId)

        if (!lesson) {
            throw new NotFoundException('Không tìm thấy bài học')
        }

        // 2. Kiểm tra lesson có phải DRAFT không
        if (lesson.visibility === Visibility.DRAFT) {
            throw new ConflictException('Bài học này chưa được công bố')
        }

        // 3. Kiểm tra course có tồn tại không
        const course = await this.courseRepository.findById(lesson.courseId)

        if (!course) {
            throw new NotFoundException('Không tìm thấy khóa học')
        }

        // 4. Kiểm tra student đã enroll vào course chưa
        const enrollment = await this.courseEnrollmentRepository.findByCourseAndStudent(
            lesson.courseId, 
            studentId
        )

        if (!enrollment || !enrollment.isActive()) {
            throw new ForbiddenException('Bạn chưa đăng ký khóa học này')
        }

        // 5. Lấy tất cả learning item IDs từ lesson
        const learningItemIds: number[] = []
        lesson.learningItems?.forEach(li => {
            if (li.learningItem?.learningItemId) {
                learningItemIds.push(li.learningItem.learningItemId)
            }
        })

        // 6. Lấy student learning items progress
        const studentLearningItemsList = learningItemIds.length > 0
            ? await this.studentLearningItemRepository.findByStudentAndItems(studentId, learningItemIds)
            : []

        // 7. Tạo Map để tra cứu nhanh
        const studentLearningItemsMap = new Map(
            studentLearningItemsList.map(sli => [sli.learningItemId, sli])
        )

        // 8. Map to response DTO với progress
        const lessonResponse = StudentLessonResponseDto.fromEntity(lesson, studentLearningItemsMap)

        return {
            success: true,
            message: 'Lấy thông tin bài học thành công',
            data: lessonResponse,
        }
    }
}
