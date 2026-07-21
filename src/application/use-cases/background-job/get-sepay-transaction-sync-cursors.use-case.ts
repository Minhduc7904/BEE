import { Inject, Injectable } from '@nestjs/common'

import {
  PaginationResponseDto,
  SepayTransactionSyncCursorListQueryDto,
  SepayTransactionSyncCursorResponseDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'

@Injectable()
export class GetSepayTransactionSyncCursorsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    query: SepayTransactionSyncCursorListQueryDto,
  ): Promise<PaginationResponseDto<SepayTransactionSyncCursorResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const { data, total } = await repos.sepayTransactionSyncCursorRepository.findAll(
        query.toSepayTransactionSyncCursorListOptions(),
      )
      return { data: SepayTransactionSyncCursorResponseDto.fromSepayTransactionSyncCursorList(data), total }
    })

    return PaginationResponseDto.success(
      'Lấy danh sách cursor đồng bộ SePay thành công',
      result.data,
      query.page ?? 1,
      query.limit ?? 10,
      result.total,
    )
  }
}
