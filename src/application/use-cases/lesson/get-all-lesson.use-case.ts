// src/application/use-cases/lesson/get-all-lesson.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { LessonListQueryDto } from '../../dtos/lesson/lesson-list-query.dto'
import { LessonListResponseDto, LessonResponseDto } from '../../dtos/lesson/lesson.dto'
import { LessonCourseClassLessonsService } from '../../services/lesson-course-class-lessons.service'

@Injectable()
export class GetAllLessonUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository,
        private readonly lessonCourseClassLessonsService: LessonCourseClassLessonsService,
    ) { }

    async execute(query: LessonListQueryDto): Promise<LessonListResponseDto> {
        const filters = query.toLessonFilterOptions()
        const pagination = query.toLessonPaginationOptions()

        const result = await this.lessonRepository.findAllWithPagination(pagination, filters)
        // console.log('GetAllLessonUseCase result:', result);
        const lessonResponses = LessonResponseDto.fromEntities(result.lessons)
        const courseClassLessonsByLessonId = await this.lessonCourseClassLessonsService.getForLessons(
            result.lessons.map((lesson) => lesson.lessonId),
            filters.courseId,
        )

        lessonResponses.forEach((lessonResponse) => {
            lessonResponse.courseClassLessons = courseClassLessonsByLessonId.get(lessonResponse.lessonId) ?? []
        })

        return new LessonListResponseDto(
            lessonResponses,
            result.page,
            result.limit,
            result.total,
        )
    }
}
