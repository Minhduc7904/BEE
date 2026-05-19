import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { UpdateStudentGraduationYearByGradeDto } from 'src/application/dtos/student/update-student-graduation-year-by-grade.dto'

interface UpdateStudentGraduationYearByGradeResult {
    grade: number
    highSchoolGraduationYear: number
    updatedCount: number
}

@Injectable()
export class UpdateStudentGraduationYearByGradeUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: UpdateStudentGraduationYearByGradeDto,
    ): Promise<BaseResponseDto<UpdateStudentGraduationYearByGradeResult>> {
        if (dto.grade < 1 || dto.grade > 12) {
            throw new BadRequestException('Khối lớp phải nằm trong khoảng từ 1 đến 12')
        }

        if (dto.highSchoolGraduationYear < 1900 || dto.highSchoolGraduationYear > 2100) {
            throw new BadRequestException('Năm tốt nghiệp cấp 3 không hợp lệ')
        }

        const updatedCount = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.studentRepository.updateMissingGraduationYearByGrade(
                dto.grade,
                dto.highSchoolGraduationYear,
            )
        })

        return BaseResponseDto.success(
            'Cập nhật năm tốt nghiệp cấp 3 theo khối thành công',
            {
                grade: dto.grade,
                highSchoolGraduationYear: dto.highSchoolGraduationYear,
                updatedCount,
            },
        )
    }
}
