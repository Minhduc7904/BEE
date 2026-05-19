import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { PromoteStudentGradeByGraduationYearDto } from 'src/application/dtos/student/promote-student-grade-by-graduation-year.dto'

interface PromoteStudentGradeByGraduationYearResult {
    highSchoolGraduationYear: number
    totalStudents: number
    updatedCount: number
    skippedCount: number
}

@Injectable()
export class PromoteStudentGradeByGraduationYearUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: PromoteStudentGradeByGraduationYearDto,
    ): Promise<BaseResponseDto<PromoteStudentGradeByGraduationYearResult>> {
        if (dto.highSchoolGraduationYear < 1900 || dto.highSchoolGraduationYear > 2100) {
            throw new BadRequestException('Năm tốt nghiệp cấp 3 không hợp lệ')
        }

        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.studentRepository.promoteGradeByGraduationYear(dto.highSchoolGraduationYear)
        })

        return BaseResponseDto.success(
            'Tăng khối học sinh theo năm tốt nghiệp cấp 3 thành công',
            {
                highSchoolGraduationYear: dto.highSchoolGraduationYear,
                ...result,
            },
        )
    }
}
