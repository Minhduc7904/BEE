import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, TuitionCollectionConfigurationResponseDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetTuitionCollectionConfigurationUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(): Promise<BaseResponseDto<TuitionCollectionConfigurationResponseDto>> {
    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const configuration = await repos.tuitionCollectionConfigurationRepository.findCurrent()
      if (!configuration) {
        throw new NotFoundException(
          'Chưa có cấu hình thu học phí. Hãy khởi tạo cấu hình trước khi sử dụng.',
        )
      }

      return TuitionCollectionConfigurationResponseDto.fromTuitionCollectionConfiguration(configuration)
    })

    return BaseResponseDto.success('Lấy cấu hình thu học phí thành công', response)
  }
}
