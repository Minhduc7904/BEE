import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus } from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos'
import { AllowParentRegistrationDto } from '../../dtos/auth/parent-account-deletion.dto'
import { ParentAccountDeletionService } from '../auth/parent/parent-account-deletion.service'

@Injectable()
export class AllowParentRegistrationUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly deletionService: ParentAccountDeletionService,
  ) {}

  async execute(dto: AllowParentRegistrationDto, adminId: number): Promise<BaseResponseDto<{ allowed: true }>> {
    const { phoneLookupHash } = this.deletionService.hashPhone(dto.phone)
    await this.unitOfWork.executeInTransaction(async (repos) => {
      const allowed = await repos.parentAccountDeletionRepository.allowRegistration(phoneLookupHash)
      if (!allowed) {
        throw new NotFoundException('Không tìm thấy yêu cầu xóa cho số điện thoại này')
      }
      await repos.adminAuditLogRepository.create({
        actionKey: 'user:manage-account-deletion',
        status: AuditStatus.SUCCESS,
        resourceType: 'PARENT_ACCOUNT_DELETION',
        adminId,
        afterData: { allowed: true },
      })
    })
    return BaseResponseDto.success('Đã cho phép số điện thoại đăng ký lại', { allowed: true })
  }
}
