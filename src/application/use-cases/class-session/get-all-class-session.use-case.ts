import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import {
    ClassSessionListResponseDto,
    ClassSessionResponseDto,
} from '../../dtos/class-session/class-session.dto';
import { ClassSessionListQueryDto } from '../../dtos/class-session/class-session-list-query.dto';

@Injectable()
export class GetAllClassSessionUseCase {
    constructor(
        @Inject('IClassSessionRepository')
        private readonly classSessionRepository: IClassSessionRepository,
    ) { }

    async execute(
        query: ClassSessionListQueryDto,
    ): Promise<ClassSessionListResponseDto> {
        const filters = query.toClassSessionFilterOptions();
        const pagination = query.toClassSessionPaginationOptions();

        const result = await this.classSessionRepository.findAllWithPagination(
            pagination,
            filters,
        );

        const classSessionResponses = result.data.map(
            (classSession) => new ClassSessionResponseDto(classSession),
        );

        return new ClassSessionListResponseDto(
            classSessionResponses,
            result.page,
            result.limit,
            result.total,
        );
    }
}
