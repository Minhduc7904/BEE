import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { CreateTuitionPaymentDto } from 'src/application/dtos/tuition-payment/create-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ConflictException, NotFoundException, ForbiddenException } from 'src/shared/exceptions/custom-exceptions'
import { AuditStatus, NotificationType, NotificationLevel, TuitionPaymentStatusLabels } from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { CreateTuitionPaymentData } from 'src/domain/interface'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'

@Injectable()
export class CreateTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
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

      // Kiểm tra student active
      const studentToCheck = await repos.studentRepository.findById(dto.studentId)
      if (!studentToCheck) {
        throw new NotFoundException(`Học sinh với ID ${dto.studentId} không tồn tại`)
      }
      if (!studentToCheck.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể tạo học phí')
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

      // Gửi thông báo cho học sinh
      const student = await repos.studentRepository.findById(dto.studentId)
      if (student) {
        const statusLabel = TuitionPaymentStatusLabels[payment.status] || payment.status
        this.createAndNotifyOne.execute({
          userId: student.userId,
          title: 'Học phí mới',
          message: `Học phí tháng ${payment.month}/${payment.year} đã được tạo - Số tiền: ${payment.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${statusLabel}`,
          type: NotificationType.TUITION,
          level: NotificationLevel.INFO,
          data: { paymentId: payment.paymentId, amount: payment.amount, month: payment.month, year: payment.year, status: payment.status },
        }).catch(() => { /* ignore notification error */ })
      }

      return new TuitionPaymentResponseDto(payment)
    })

    return BaseResponseDto.success('Tạo học phí thành công', result)
  }
}
