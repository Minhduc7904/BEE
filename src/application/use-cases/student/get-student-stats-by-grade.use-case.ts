import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, StudentListQueryDto } from 'src/application/dtos'
import { StudentGradeStatsListResponseDto } from 'src/application/dtos/student/student-stats-response.dto'
import type { IStudentRepository } from 'src/domain/repositories'

@Injectable()
export class GetStudentStatsByGradeUseCase {
    constructor(
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(
        query: StudentListQueryDto,
    ): Promise<BaseResponseDto<StudentGradeStatsListResponseDto>> {
        const rawStats =
            await this.studentRepository.statsByGrade(
                query.toStudentFilterOptions(),
            )

        // Map theo grade để dễ lookup
        const statsMap = new Map<number, { active: number; inactive: number }>()
        for (const item of rawStats) {
            statsMap.set(item.grade, {
                active: item.active,
                inactive: item.inactive,
            })
        }

        // Luôn trả đủ 12 grade (1 → 12)
        const normalizedStats = Array.from({ length: 12 }, (_, i) => {
            const grade = i + 1
            const stat = statsMap.get(grade)

            return {
                grade,
                active: stat?.active ?? 0,
                inactive: stat?.inactive ?? 0,
            }
        })

        return BaseResponseDto.success(
            'Lấy thống kê học sinh theo khối thành công',
            new StudentGradeStatsListResponseDto(normalizedStats),
        )
    }
}
