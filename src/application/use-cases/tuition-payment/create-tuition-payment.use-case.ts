import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { CreateTuitionPaymentDto } from 'src/application/dtos/tuition-payment/create-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { AuditStatus } from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { CreateTuitionPaymentData } from 'src/domain/interface'

@Injectable()
export class CreateTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateTuitionPaymentDto, adminId?: number): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPaymentRepository = repos.tuitionPaymentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      const exiting = await tuitionPaymentRepository.exists({
        studentId: dto.studentId,
        courseId: dto.courseId,
        month: dto.month,
        year: dto.year,
      })
      if (exiting) {
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.TUITION_PAYMENT.CREATE,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
            errorMessage: 'Học phí cho học sinh này trong khóa học và tháng/năm đã tồn tại',
          })
        }
        throw new ConflictException('Học phí cho học sinh này trong khóa học và tháng/năm đã tồn tại')
      }

      const data: CreateTuitionPaymentData = {
        studentId: dto.studentId,
        courseId: dto.courseId,
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
        status: dto.status,
        notes: dto.notes,
      }

      const payment = await tuitionPaymentRepository.create(data)

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: payment.paymentId.toString(),
        })
      }

      return new TuitionPaymentResponseDto(payment)
    })

    return BaseResponseDto.success('Tạo học phí thành công', result)
  }
}
