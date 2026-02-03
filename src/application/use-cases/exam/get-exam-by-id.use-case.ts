// src/application/use-cases/exam/get-exam-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ExamResponseDto } from '../../dtos/exam/exam.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetExamByIdUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
  ) {}

  async execute(examId: number): Promise<BaseResponseDto<ExamResponseDto>> {
    const exam = await this.examRepository.findById(examId)

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi')
    }

    const examResponse = ExamResponseDto.fromEntity(exam)

    return {
      success: true,
      message: 'Lấy thông tin đề thi thành công',
      data: examResponse,
    }
  }
}
