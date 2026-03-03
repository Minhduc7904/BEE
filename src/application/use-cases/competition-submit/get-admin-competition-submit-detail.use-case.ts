// src/application/use-cases/competition-submit/get-admin-competition-submit-detail.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { AdminCompetitionSubmitDetailDto, AdminCompetitionSubmitDetailResponseDto } from '../../dtos/competition-submit/admin-competition-submit-detail.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

/**
 * Admin use case: Lấy chi tiết đầy đủ 1 bài nộp cuộc thi.
 *
 * Trả về:
 * - Thông tin bài nộp (status, điểm, thời gian…)
 * - Thông tin học sinh
 * - Thông tin cuộc thi
 * - Danh sách câu trả lời, mỗi câu kèm:
 *     + Câu hỏi đầy đủ (content, type, correctAnswer, solution)
 *     + Tất cả statements (có isCorrect)
 *     + Kết quả chấm (isCorrect, points)
 */
@Injectable()
export class GetAdminCompetitionSubmitDetailUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(submitId: number): Promise<BaseResponseDto<AdminCompetitionSubmitDetailDto>> {
        const submit = await this.competitionSubmitRepository.findByIdWithFullDetails(submitId)

        if (!submit) {
            throw new NotFoundException(`Bài nộp với ID ${submitId} không tồn tại`)
        }

        const dto = AdminCompetitionSubmitDetailDto.fromEntity(submit)

        return BaseResponseDto.success(
            'Lấy chi tiết bài nộp thành công',
            dto,
        )
    }
}
