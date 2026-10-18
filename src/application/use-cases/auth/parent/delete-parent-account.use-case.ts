import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../../dtos'
import { DeleteParentAccountDto, DeleteParentAccountResponseDto } from '../../../dtos/auth/parent-account-deletion.dto'
import { ParentAccountDeletionService } from './parent-account-deletion.service'

@Injectable()
export class DeleteParentAccountUseCase {
  constructor(private readonly service: ParentAccountDeletionService) {}

  async execute(userId: number, dto: DeleteParentAccountDto): Promise<BaseResponseDto<DeleteParentAccountResponseDto>> {
    const { deletedAt } = await this.service.deleteAuthenticated(userId, dto.password)
    return BaseResponseDto.success('Tài khoản đã được xóa', { status: 'DELETED', deletedAt })
  }
}
