import { Inject, Injectable } from "@nestjs/common";
import type { ITuitionPaymentRepository } from "src/domain/repositories/tuition-payment.repository";
import {
    TuitionPaymentListResponseDto,
} from "../../dtos/tuition-payment/tuition-payment.dto";
import {
    MyTuitionPaymentListResponseDto,
    MyTuitionPaymentResponseDto,
} from '../../dtos/tuition-payment/my-tuition-payment.dto'
import { AdminTuitionPaymentResponseDto } from '../../dtos/tuition-payment/admin-tuition-payment.dto'
import type { IPaymentIntentRepository } from 'src/domain/repositories/payment-intent.repository'
import { TuitionPaymentListQueryDto } from "../../dtos/tuition-payment/tuition-payment-list-query.dto";

@Injectable()
export class GetTuitionPaymentsUseCase {
    constructor(
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
        @Inject('IPaymentIntentRepository')
        private readonly paymentIntentRepository: IPaymentIntentRepository,
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

        const paymentIntents = await Promise.all(
            result.data.map((tuitionPayment) =>
                this.paymentIntentRepository.findByTuitionPaymentId(tuitionPayment.paymentId),
            ),
        )
        const tuitionPaymentResponses = result.data.map(
            (tuitionPayment, index) => new AdminTuitionPaymentResponseDto(tuitionPayment, paymentIntents[index]),
        )
        return new TuitionPaymentListResponseDto(
            tuitionPaymentResponses,
            result.page,
            result.limit,
            result.total,
        );
    }

    async executeForStudent(
        query: TuitionPaymentListQueryDto,
        studentId: number,
    ): Promise<MyTuitionPaymentListResponseDto> {
        const filters = {
            ...query.toTuitionPaymentFilterOptions(),
            studentId,
        }
        const pagination = query.toTuitionPaymentPaginationOptions()
        const result = await this.tuitionPaymentRepository.findAllWithPagination(pagination, filters)
        const paymentIntents = await Promise.all(
            result.data.map((tuitionPayment) =>
                this.paymentIntentRepository.findByTuitionPaymentId(tuitionPayment.paymentId),
            ),
        )
        const tuitionPaymentResponses = result.data.map(
            (tuitionPayment, index) => new MyTuitionPaymentResponseDto(tuitionPayment, paymentIntents[index]),
        )

        return new MyTuitionPaymentListResponseDto(
            tuitionPaymentResponses,
            result.page,
            result.limit,
            result.total,
        )
    }
}
