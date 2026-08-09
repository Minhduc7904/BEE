import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BaseResponseDto, CoursePaymentConfigurationResponseDto, UpdateCoursePaymentConfigurationDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetCoursePaymentConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(): Promise<BaseResponseDto<CoursePaymentConfigurationResponseDto>> {
    const configuration = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.coursePaymentConfigurationRepository.findCurrent()
      if (!current) throw new NotFoundException('Chưa có cấu hình thanh toán khóa học')
      return current
    })
    return BaseResponseDto.success('Lấy cấu hình thanh toán khóa học thành công', configuration)
  }
}

@Injectable()
export class UpdateCoursePaymentConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    dto: UpdateCoursePaymentConfigurationDto,
  ): Promise<BaseResponseDto<CoursePaymentConfigurationResponseDto>> {
    const configuration = await this.unitOfWork.executeInTransaction(async (repos) => {
      const bank = await repos.receivingBankAccountRepository.findById(dto.receivingBankAccountId)
      if (!bank || !bank.isAvailableForManualCollection()) {
        throw new NotFoundException('Tài khoản nhận tiền không sẵn sàng')
      }
      return repos.coursePaymentConfigurationRepository.upsert(dto.receivingBankAccountId)
    })
    return BaseResponseDto.success('Cập nhật cấu hình thanh toán khóa học thành công', configuration)
  }
}
