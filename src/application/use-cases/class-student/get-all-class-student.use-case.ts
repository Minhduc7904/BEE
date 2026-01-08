import { Inject, Injectable } from '@nestjs/common';
import type { IClassStudentRepository } from 'src/domain/repositories/class-student.repository';
import {
    ClassStudentFilterOptions,
    ClassStudentPaginationOptions,
} from 'src/domain/interface/class-student/class-student.interface';
import {
    ClassStudentResponseDto,
    ClassStudentListResponseDto,
} from '../../dtos/class-student/class-student.dto';
import { ClassStudentListQueryDto } from 'src/application/dtos/class-student/class-student-list-query.dto';

@Injectable()
export class GetAllClassStudentUseCase {
    constructor(
        @Inject('IClassStudentRepository')
        private readonly classStudentRepository: IClassStudentRepository,
    ) { }

    async execute(
        query: ClassStudentListQueryDto,
    ): Promise<ClassStudentListResponseDto> {
        const filterOptions: ClassStudentFilterOptions = query.toClassStudentFilterOptions();
        const paginationOptions: ClassStudentPaginationOptions = query.toClassStudentPaginationOptions();
        const { data, total } =
            await this.classStudentRepository.findAllWithPagination(
                paginationOptions,
                filterOptions,
            );

        const classStudentDtos = data.map(
            (classStudent) => new ClassStudentResponseDto(classStudent),
        );

        return new ClassStudentListResponseDto(
            classStudentDtos,
            paginationOptions.page,
            paginationOptions.limit,
            total,
        );
    }
}
