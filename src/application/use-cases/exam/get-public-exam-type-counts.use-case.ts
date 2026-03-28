import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    PublicExamTypeCountItemDto,
    PublicExamTypeCountResponseDto,
} from '../../dtos/exam/exam.dto'
import { TypeOfExam, TYPE_OF_EXAM_LABELS } from '../../../shared/enums'

@Injectable()
export class GetPublicExamTypeCountsUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
    ) { }

    async execute(): Promise<BaseResponseDto<PublicExamTypeCountResponseDto>> {
        const grouped = await this.examRepository.countPublishedByType()

        const totalByType = new Map<TypeOfExam, number>()
        for (const item of grouped) {
            if (!item.typeOfExam) continue
            totalByType.set(item.typeOfExam, item.total)
        }

        const items = Object.values(TypeOfExam).map((typeOfExam) =>
            new PublicExamTypeCountItemDto({
                typeOfExam,
                label: TYPE_OF_EXAM_LABELS[typeOfExam],
                total: totalByType.get(typeOfExam) || 0,
            }),
        )

        const totalPublished = items.reduce((sum, item) => sum + item.total, 0)

        return BaseResponseDto.success(
            'Lấy thống kê số lượng đề thi public theo loại thành công',
            new PublicExamTypeCountResponseDto({
                totalPublished,
                items,
            }),
        )
    }
}
