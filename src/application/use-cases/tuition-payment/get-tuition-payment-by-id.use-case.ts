import { Inject, Injectable } from "@nestjs/common";
import { BaseResponseDto, TuitionPaymentResponseDto } from "src/application/dtos";
import type { ITuitionPaymentRepository } from "src/domain/repositories/tuition-payment.repository";
import { NotFoundException, ForbiddenException } from "src/shared/exceptions/custom-exceptions";

@Injectable()
export class GetTuitionPaymentByIdUseCase {
    constructor(
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
    ) {}

    async execute(tuitionPaymentId: number, studentId?: number): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
        const tuitionPayment = await this.tuitionPaymentRepository.findById(tuitionPaymentId);
        if (studentId && tuitionPayment?.studentId !== studentId) {
            throw new ForbiddenException(`Bạn không có quyền truy cập học phí này`);
        }

        if (!tuitionPayment) {
            throw new NotFoundException(`Học phí với ID ${tuitionPaymentId} không tồn tại`);
        }
        
        return BaseResponseDto.success(
            'Lấy học phí thành công',
            new TuitionPaymentResponseDto(tuitionPayment),
        );
    }
}