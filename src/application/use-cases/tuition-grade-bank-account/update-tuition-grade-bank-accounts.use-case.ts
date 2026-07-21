import { Inject, Injectable } from '@nestjs/common'

import {
  BaseResponseDto,
  TuitionGradeBankAccountResponseDto,
  UpdateTuitionGradeBankAccountsDto,
} from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus } from '../../../shared/enums'
import { GetTuitionGradeBankAccountsUseCase } from './get-tuition-grade-bank-accounts.use-case'

@Injectable()
export class UpdateTuitionGradeBankAccountsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly getTuitionGradeBankAccountsUseCase: GetTuitionGradeBankAccountsUseCase,
  ) {}

  async execute(
    dto: UpdateTuitionGradeBankAccountsDto,
    adminId: number,
    canViewSensitiveAccountNumber: boolean,
  ): Promise<BaseResponseDto<TuitionGradeBankAccountResponseDto[]>> {
    this.ensureUniqueGrades(dto)

    await this.unitOfWork.executeInTransaction(async (repos) => {
      const mappings = await repos.tuitionGradeReceivingBankAccountRepository.findAll()
      const mappingByGrade = new Map(mappings.map((mapping) => [mapping.grade, mapping]))

      for (const item of dto.mappings) {
        const current = mappingByGrade.get(item.grade)
        if (!current) {
          throw new NotFoundException(`Không tìm thấy cấu hình tài khoản nhận tiền cho khối ${item.grade}`)
        }

        if (item.receivingBankAccountId !== null) {
          const account = await repos.receivingBankAccountRepository.findById(item.receivingBankAccountId)
          if (!account) {
            throw new NotFoundException(`Không tìm thấy tài khoản nhận tiền với ID ${item.receivingBankAccountId}`)
          }
        }

        if ((current.receivingBankAccountId ?? null) === item.receivingBankAccountId) continue

        const updated = await repos.tuitionGradeReceivingBankAccountRepository.update(
          current.tuitionGradeReceivingBankAccountId,
          { receivingBankAccountId: item.receivingBankAccountId },
        )
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_GRADE_BANK_ACCOUNT.CONFIGURE,
          resourceType: RESOURCE_TYPES.TUITION_GRADE_BANK_ACCOUNT,
          resourceId: String(updated.tuitionGradeReceivingBankAccountId),
          status: AuditStatus.SUCCESS,
          beforeData: this.toAuditData(current),
          afterData: this.toAuditData(updated),
        })
      }
    })

    const response = await this.getTuitionGradeBankAccountsUseCase.execute(canViewSensitiveAccountNumber)
    return BaseResponseDto.success('Cập nhật cấu hình tài khoản nhận tiền theo khối thành công', response.data)
  }

  private ensureUniqueGrades(dto: UpdateTuitionGradeBankAccountsDto): void {
    const grades = dto.mappings.map((mapping) => mapping.grade)
    if (new Set(grades).size !== grades.length) {
      throw new ConflictException('Mỗi khối chỉ được cấu hình một lần trong cùng yêu cầu')
    }
  }

  private toAuditData(input: {
    tuitionGradeReceivingBankAccountId: number
    grade: number
    receivingBankAccountId?: number | null
  }) {
    return {
      tuitionGradeReceivingBankAccountId: input.tuitionGradeReceivingBankAccountId,
      grade: input.grade,
      receivingBankAccountId: input.receivingBankAccountId ?? null,
    }
  }
}
