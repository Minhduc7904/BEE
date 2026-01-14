// src/application/use-cases/lesson/get-all-lesson.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { LessonListQueryDto } from '../../dtos/lesson/lesson-list-query.dto'
import { LessonListResponseDto, LessonResponseDto } from '../../dtos/lesson/lesson.dto'

@Injectable()
export class GetAllLessonUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository
    ) { }

    async execute(query: LessonListQueryDto): Promise<LessonListResponseDto> {
        const filters = query.toLessonFilterOptions()
        const pagination = query.toLessonPaginationOptions()

        const result = await this.lessonRepository.findAllWithPagination(pagination, filters)

        const lessonResponses = LessonResponseDto.fromEntities(result.lessons)

        return new LessonListResponseDto(
            lessonResponses,
            result.page,
            result.limit,
            result.total,
        )
    }
}
