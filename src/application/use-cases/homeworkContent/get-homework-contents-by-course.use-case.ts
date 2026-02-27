// src/application/use-cases/homeworkContent/get-homework-contents-by-course.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import type { IHomeworkContentRepository } from '../../../domain/repositories'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { LearningItemType } from '../../../shared/enums'

/**
 * Get all HomeworkContents belonging to a Course.
 *
 * Logic:
 *   1. Fetch all Lessons of the course (with their LessonLearningItem relations)
 *   2. Collect unique LearningItem IDs whose type === HOMEWORK
 *   3. Fetch HomeworkContents for those LearningItem IDs (parallel)
 *   4. Flatten and return as DTOs
 */
@Injectable()
export class GetHomeworkContentsByCourseUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository,
        @Inject('IHomeworkContentRepository')
        private readonly homeworkContentRepository: IHomeworkContentRepository,
    ) { }

    async execute(courseId: number): Promise<BaseResponseDto<{
        homeworkContents: HomeworkContentResponseDto[]
        total: number
    }>> {
        // 1. Get all lessons in the course (includes learningItems with type info)
        const lessons = await this.lessonRepository.findByCourse(courseId)

        if (!lessons || lessons.length === 0) {
            return BaseResponseDto.success(
                'Không có bài học nào trong khoá học này',
                { homeworkContents: [], total: 0 },
            )
        }

        // 2. Collect unique learningItemIds whose type === HOMEWORK
        const seenIds = new Set<number>()
        for (const lesson of lessons) {
            if (!lesson.learningItems) continue
            for (const lli of lesson.learningItems) {
                if (
                    lli.learningItem?.type === LearningItemType.HOMEWORK &&
                    !seenIds.has(lli.learningItemId)
                ) {
                    seenIds.add(lli.learningItemId)
                }
            }
        }

        if (seenIds.size === 0) {
            return BaseResponseDto.success(
                'Không có bài tập nào trong khoá học này',
                { homeworkContents: [], total: 0 },
            )
        }

        // 3. Fetch HomeworkContents in parallel for all homework learning items
        const contentArrays = await Promise.all(
            [...seenIds].map((id) => this.homeworkContentRepository.findByLearningItem(id)),
        )

        // 4. Flatten and map to DTOs
        const homeworkContents = contentArrays
            .flat()
            .map((hc) => HomeworkContentResponseDto.fromEntity(hc))

        return BaseResponseDto.success(
            'Lấy danh sách bài tập theo khoá học thành công',
            { homeworkContents, total: homeworkContents.length },
        )
    }
}
