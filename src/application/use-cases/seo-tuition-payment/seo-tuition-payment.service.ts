import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  CancelPaymentAttemptResponseDto,
  MyTuitionPaymentResponseDto,
  MyTuitionPaymentListResponseDto,
  PaymentInstructionResponseDto,
  SeoStudentResponseDto,
  SeoTuitionPaymentStatsQueryDto,
  TuitionPaymentIntentStatusResponseDto,
  TuitionPaymentListQueryDto,
  TuitionPaymentMoneyStatsResponseDto,
  TuitionPaymentStatsResponseDto,
} from '../../dtos'
import type { IStudentRepository } from '../../../domain/repositories/student.repository'
import {
  CancelMyPaymentAttemptUseCase,
  GetMyTuitionPaymentInstructionsUseCase,
  RefreshMyTuitionPaymentInstructionsUseCase,
} from '../payment-attempt'
import {
  GetMyTuitionPaymentByIdUseCase,
  GetMyTuitionPaymentIntentStatusUseCase,
  GetMyTuitionPaymentStatsByMoneyUseCase,
  GetMyTuitionPaymentStatsByStatusUseCase,
  GetTuitionPaymentsUseCase,
} from '../tuition-payment'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class SeoTuitionPaymentAccessService {
  constructor(@Inject('IStudentRepository') private readonly studentRepository: IStudentRepository) {}

  async searchStudents(phone: string): Promise<BaseResponseDto<SeoStudentResponseDto[]>> {
    const students = await this.studentRepository.findAllByStudentOrParentPhone(phone)
    const accessibleStudents = students.filter((student) => Boolean(student.parentPhone?.trim()))

    return BaseResponseDto.success(
      'Tìm thấy học sinh theo số điện thoại',
      SeoStudentResponseDto.fromStudents(accessibleStudents),
    )
  }

  async assertParentAccess(studentId: number, parentPhone: string): Promise<void> {
    const student = await this.studentRepository.findById(studentId)
    if (!student?.parentPhone?.trim() || !this.isSamePhone(student.parentPhone, parentPhone)) {
      throw new NotFoundException('Không tìm thấy học sinh phù hợp với số điện thoại phụ huynh')
    }
  }

  private isSamePhone(left: string, right: string): boolean {
    return left.replace(/\D/g, '') === right.replace(/\D/g, '')
  }
}

@Injectable()
export class SeoTuitionPaymentService {
  constructor(
    private readonly access: SeoTuitionPaymentAccessService,
    private readonly getTuitionPaymentsUseCase: GetTuitionPaymentsUseCase,
    private readonly getMyTuitionPaymentByIdUseCase: GetMyTuitionPaymentByIdUseCase,
    private readonly getMyTuitionPaymentIntentStatusUseCase: GetMyTuitionPaymentIntentStatusUseCase,
    private readonly getMyTuitionPaymentStatsByStatusUseCase: GetMyTuitionPaymentStatsByStatusUseCase,
    private readonly getMyTuitionPaymentStatsByMoneyUseCase: GetMyTuitionPaymentStatsByMoneyUseCase,
    private readonly getMyTuitionPaymentInstructionsUseCase: GetMyTuitionPaymentInstructionsUseCase,
    private readonly refreshMyTuitionPaymentInstructionsUseCase: RefreshMyTuitionPaymentInstructionsUseCase,
    private readonly cancelMyPaymentAttemptUseCase: CancelMyPaymentAttemptUseCase,
  ) {}

  async getPayments(
    studentId: number,
    parentPhone: string,
    query: TuitionPaymentListQueryDto,
  ): Promise<MyTuitionPaymentListResponseDto> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getTuitionPaymentsUseCase.executeForStudent(query, studentId)
  }

  async getStatsByStatus(
    studentId: number,
    parentPhone: string,
    query: SeoTuitionPaymentStatsQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentStatsResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentStatsByStatusUseCase.execute(query, studentId)
  }

  async getStatsByMoney(
    studentId: number,
    parentPhone: string,
    query: SeoTuitionPaymentStatsQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentMoneyStatsResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentStatsByMoneyUseCase.execute(query, studentId)
  }

  async getPayment(
    studentId: number,
    parentPhone: string,
    tuitionPaymentId: number,
  ): Promise<BaseResponseDto<MyTuitionPaymentResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentByIdUseCase.execute(tuitionPaymentId, studentId)
  }

  async getIntentStatus(
    studentId: number,
    parentPhone: string,
    tuitionPaymentId: number,
  ): Promise<BaseResponseDto<TuitionPaymentIntentStatusResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentIntentStatusUseCase.execute(tuitionPaymentId, studentId)
  }

  async getIntentStatusByPaymentIntentId(
    studentId: number,
    parentPhone: string,
    paymentIntentId: number,
  ): Promise<TuitionPaymentIntentStatusResponseDto> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentIntentStatusUseCase.getByPaymentIntentId(paymentIntentId, studentId)
  }

  async getPaymentInstructions(
    studentId: number,
    parentPhone: string,
    tuitionPaymentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.getMyTuitionPaymentInstructionsUseCase.execute(tuitionPaymentId, studentId)
  }

  async refreshPaymentInstructions(
    studentId: number,
    parentPhone: string,
    tuitionPaymentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.refreshMyTuitionPaymentInstructionsUseCase.execute(tuitionPaymentId, studentId)
  }

  async cancelPaymentAttempt(
    studentId: number,
    parentPhone: string,
    tuitionPaymentId: number,
    paymentAttemptId: number,
  ): Promise<BaseResponseDto<CancelPaymentAttemptResponseDto>> {
    await this.access.assertParentAccess(studentId, parentPhone)
    return this.cancelMyPaymentAttemptUseCase.execute(tuitionPaymentId, paymentAttemptId, studentId)
  }
}
