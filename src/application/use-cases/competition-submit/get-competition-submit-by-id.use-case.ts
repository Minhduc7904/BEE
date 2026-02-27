// src/application/use-cases/competition-submit/get-competition-submit-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { CompetitionSubmitResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetCompetitionSubmitByIdUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
        const submit = await this.competitionSubmitRepository.findById(id)

        if (!submit) {
            throw new NotFoundException(`Bài nộp với ID ${id} không tồn tại`)
        }

        const dto = CompetitionSubmitResponseDto.fromEntity(submit)
        return BaseResponseDto.success('Lấy thông tin bài nộp thành công', dto)
    }
}
