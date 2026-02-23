import { Inject, Injectable } from '@nestjs/common';
import type { IClassSessionRepository } from 'src/domain/repositories/class-session.repository';
import {
    ClassSessionListResponseDto,
    ClassSessionResponseDto,
} from '../../dtos/class-session/class-session.dto';
import { StudentClassSessionQueryDto } from '../../dtos/class-session/student-class-session-query.dto';

@Injectable()
export class GetStudentClassSessionsUseCase {
    constructor(
        @Inject('IClassSessionRepository')
        private readonly classSessionRepository: IClassSessionRepository,
    ) { }

    async execute(
        studentId: number,
        query: StudentClassSessionQueryDto,
    ): Promise<ClassSessionListResponseDto> {
        const filters = query.toClassSessionFilterOptions();
        const pagination = query.toClassSessionPaginationOptions();

        const result = await this.classSessionRepository.findStudentClassSessionsWithPagination(
            studentId,
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
