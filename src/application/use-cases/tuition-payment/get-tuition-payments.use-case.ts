import { Inject, Injectable } from "@nestjs/common";
import type { ITuitionPaymentRepository } from "src/domain/repositories/tuition-payment.repository";
import {
    TuitionPaymentListResponseDto,
    TuitionPaymentResponseDto,
} from "../../dtos/tuition-payment/tuition-payment.dto";
import { TuitionPaymentListQueryDto } from "../../dtos/tuition-payment/tuition-payment-list-query.dto";

@Injectable()
export class GetTuitionPaymentsUseCase {
    constructor(
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
    ) {}

    async execute(
        query: TuitionPaymentListQueryDto,
    ): Promise<TuitionPaymentListResponseDto> {
        const filters = query.toTuitionPaymentFilterOptions();
        const pagination = query.toTuitionPaymentPaginationOptions();
        const result = await this.tuitionPaymentRepository.findAllWithPagination(
            pagination,
            filters,
        );

        const tuitionPaymentResponses = result.data.map(
            (tuitionPayment) => new TuitionPaymentResponseDto(tuitionPayment),
        );
        return new TuitionPaymentListResponseDto(
            tuitionPaymentResponses,
            result.page,
            result.limit,
            result.total,
        );
    }
}