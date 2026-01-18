// src/application/use-cases/homeworkSubmit/get-all-homework-submit.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories'
import { HomeworkSubmitListQueryDto } from '../../dtos/homeworkSubmit/homework-submit-list-query.dto'
import { HomeworkSubmitListResponseDto, HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllHomeworkSubmitUseCase {
    constructor(
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    ) { }

    async execute(query: HomeworkSubmitListQueryDto): Promise<HomeworkSubmitListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            homeworkContentId: query.homeworkContentId,
            studentId: query.studentId,
            graderId: query.graderId,
            isGraded: query.isGraded,
            search: query.search,
        }

        const result = await this.homeworkSubmitRepository.findAllWithPagination(pagination, filters)

        const homeworkSubmitDtos = result.homeworkSubmits.map((item) =>
            HomeworkSubmitResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Homework submits retrieved successfully',
            {
                homeworkSubmits: homeworkSubmitDtos,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            },
        )
    }
}
