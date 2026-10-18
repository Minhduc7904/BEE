import { Injectable } from '@nestjs/common'
import { ParentAccountDeletionSource } from '../../../../domain/enums/parent-account-deletion-source.enum'
import { BaseResponseDto } from '../../../dtos'
import {
  DeleteParentAccountPublicDto,
  DeleteParentAccountResponseDto,
} from '../../../dtos/auth/parent-account-deletion.dto'
import { ParentAccountDeletionService } from './parent-account-deletion.service'

@Injectable()
export class DeleteParentAccountPublicUseCase {
  constructor(private readonly service: ParentAccountDeletionService) {}

  async execute(dto: DeleteParentAccountPublicDto): Promise<BaseResponseDto<DeleteParentAccountResponseDto>> {
    const { deletedAt } = await this.service.deleteByCredentials(
      dto.phone,
      dto.password,
      ParentAccountDeletionSource.WEB,
    )
    return BaseResponseDto.success('Tài khoản đã được xóa', { status: 'DELETED', deletedAt })
  }
}
