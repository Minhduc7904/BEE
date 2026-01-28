import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, StudentListQueryDto } from 'src/application/dtos'
import { StudentStatsResponseDto } from 'src/application/dtos/student/student-stats-response.dto'
import type { IStudentRepository } from 'src/domain/repositories'

@Injectable()
export class GetStudentStatsByStatusUseCase {
    constructor(
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(query: StudentListQueryDto): Promise<BaseResponseDto<StudentStatsResponseDto>> {
        const stats = await this.studentRepository.statsByStatus(query.toStudentFilterOptions())
        /**
         * Chuẩn hóa response:
         * - Luôn có đủ ACTIVE / INACTIVE
         */
        const map = new Map<string, number>()
        for (const s of stats) {
            map.set(s.status, s.total)
        }
        return BaseResponseDto.success(
            'Lấy thống kê học sinh theo trạng thái thành công',
            new StudentStatsResponseDto({
                active: map.get('ACTIVE') || 0,
                inactive: map.get('INACTIVE') || 0,
            }),
        )
    }
}