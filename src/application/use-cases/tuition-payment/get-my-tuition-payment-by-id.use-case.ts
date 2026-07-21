import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, MyTuitionPaymentResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ForbiddenException, NotFoundException, UnauthorizedException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetMyTuitionPaymentByIdUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    tuitionPaymentId: number,
    studentId?: number,
  ): Promise<BaseResponseDto<MyTuitionPaymentResponseDto>> {
    if (!studentId) {
      throw new UnauthorizedException('Ch\u1ec9 h\u1ecdc sinh \u0111\u01b0\u1ee3c ph\u00e9p xem chi ti\u1ebft h\u1ecdc ph\u00ed')
    }

    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment) {
        throw new NotFoundException(`H\u1ecdc ph\u00ed v\u1edbi ID ${tuitionPaymentId} kh\u00f4ng t\u1ed3n t\u1ea1i`)
      }
      if (tuitionPayment.studentId !== studentId) {
        throw new ForbiddenException('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp h\u1ecdc ph\u00ed n\u00e0y')
      }

      const paymentIntent = await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      return new MyTuitionPaymentResponseDto(tuitionPayment, paymentIntent)
    })

    return BaseResponseDto.success('L\u1ea5y chi ti\u1ebft h\u1ecdc ph\u00ed th\u00e0nh c\u00f4ng', response)
  }
}
