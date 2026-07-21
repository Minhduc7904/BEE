import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentIntentStatusResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ForbiddenException, NotFoundException, UnauthorizedException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetMyTuitionPaymentIntentStatusUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    tuitionPaymentId: number,
    studentId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentIntentStatusResponseDto>> {
    const response = await this.getByTuitionPaymentId(tuitionPaymentId, studentId)
    return BaseResponseDto.success('L\u1ea5y tr\u1ea1ng th\u00e1i payment intent th\u00e0nh c\u00f4ng', response)
  }

  async getByPaymentIntentId(
    paymentIntentId: number,
    studentId?: number,
  ): Promise<TuitionPaymentIntentStatusResponseDto> {
    if (!studentId) {
      throw new UnauthorizedException('Ch\u1ec9 h\u1ecdc sinh \u0111\u01b0\u1ee3c ph\u00e9p theo d\u00f5i thanh to\u00e1n h\u1ecdc ph\u00ed')
    }

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const paymentIntent = await repos.paymentIntentRepository.findById(paymentIntentId)
      if (!paymentIntent) {
        throw new NotFoundException(`Payment intent v\u1edbi ID ${paymentIntentId} kh\u00f4ng t\u1ed3n t\u1ea1i`)
      }

      const tuitionPayment = await repos.tuitionPaymentRepository.findById(paymentIntent.tuitionPaymentId)
      return this.assertOwnershipAndMap(tuitionPayment, paymentIntent, studentId)
    })
  }

  private getByTuitionPaymentId(
    tuitionPaymentId: number,
    studentId?: number,
  ): Promise<TuitionPaymentIntentStatusResponseDto> {
    if (!studentId) {
      throw new UnauthorizedException('Ch\u1ec9 h\u1ecdc sinh \u0111\u01b0\u1ee3c ph\u00e9p theo d\u00f5i thanh to\u00e1n h\u1ecdc ph\u00ed')
    }

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment) {
        throw new NotFoundException(`H\u1ecdc ph\u00ed v\u1edbi ID ${tuitionPaymentId} kh\u00f4ng t\u1ed3n t\u1ea1i`)
      }
      if (tuitionPayment.studentId !== studentId) {
        throw new ForbiddenException('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp h\u1ecdc ph\u00ed n\u00e0y')
      }

      const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      if (!paymentIntent) {
        throw new NotFoundException('H\u1ecdc ph\u00ed n\u00e0y ch\u01b0a c\u00f3 payment intent')
      }

      return TuitionPaymentIntentStatusResponseDto.fromEntities(tuitionPayment, paymentIntent)
    })
  }

  private assertOwnershipAndMap(
    tuitionPayment: import('src/domain/entities/tuition-payment').TuitionPayment | null,
    paymentIntent: import('src/domain/entities/tuition-online-payment').PaymentIntent,
    studentId: number,
  ): TuitionPaymentIntentStatusResponseDto {
    if (!tuitionPayment) {
      throw new NotFoundException(`H\u1ecdc ph\u00ed v\u1edbi ID ${paymentIntent.tuitionPaymentId} kh\u00f4ng t\u1ed3n t\u1ea1i`)
    }
    if (tuitionPayment.studentId !== studentId) {
      throw new ForbiddenException('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp payment intent n\u00e0y')
    }
    return TuitionPaymentIntentStatusResponseDto.fromEntities(tuitionPayment, paymentIntent)
  }
}
