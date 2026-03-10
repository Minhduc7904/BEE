import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { CreateBulkTuitionPaymentDto } from 'src/application/dtos/tuition-payment/create-bulk-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ValidationException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { AuditStatus, NotificationType, NotificationLevel, TuitionPaymentStatusLabels } from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { CreateTuitionPaymentData } from 'src/domain/interface'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'
import { CreateAndNotifyManyUseCase } from '../notification/create-and-notify-many.use-case'

@Injectable()
export class CreateBulkTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyMany: CreateAndNotifyManyUseCase,
  ) {}

  async execute(
    dto: CreateBulkTuitionPaymentDto,
    adminId: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto[]>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const {
        tuitionPaymentRepository,
        adminAuditLogRepository,
        courseRepository,
        courseEnrollmentRepository,
        studentRepository,
      } = repos

      let studentIds: number[] = []

      try {
        /**
         * =========================
         * Resolve studentIds
         * =========================
         */
        if (dto.courseId) {
          const course = await courseRepository.findById(dto.courseId)
          if (!course) {
            throw new NotFoundException(`Khóa học với ID ${dto.courseId} không tồn tại`)
          }

          const enrollments = await courseEnrollmentRepository.findByCourse(dto.courseId)
          studentIds = enrollments.map((e) => e.studentId)
        } else if (dto.grade) {
          const students = await studentRepository.findByGrade(dto.grade)
          studentIds = students.map((s) => s.studentId)
        } else if (dto.studentIds?.length) {
          studentIds = dto.studentIds
        }

        // Lọc chỉ lấy học sinh active
        const activeStudentIds: number[] = []
        for (const sid of studentIds) {
          const s = await studentRepository.findById(sid)
          if (s?.user?.isActive) activeStudentIds.push(sid)
        }
        studentIds = activeStudentIds

        if (studentIds.length === 0) {
          throw new ValidationException('Không có học sinh nào để tạo học phí')
        }

        /**
         * =========================
         * Check existing payments
         * =========================
         */
        const existingPayments = await tuitionPaymentRepository.findWithFilter({
          courseId: dto.courseId,
          month: dto.month,
          year: dto.year,
          studentIds,
        })

        const existingStudentIds = new Set(existingPayments.map((p) => p.studentId))

        /**
         * =========================
         * Prepare create data
         * =========================
         */
        const paymentsToCreate: CreateTuitionPaymentData[] = studentIds
          .filter((studentId) => !existingStudentIds.has(studentId))
          .map((studentId) => ({
            studentId,
            courseId: dto.courseId,
            month: dto.month,
            amount: dto.amount,
            year: dto.year,
            status: dto.status,
            notes: dto.notes,
          }))

        const createdPayments: TuitionPayment[] = []

        for (const data of paymentsToCreate) {
          const payment = await tuitionPaymentRepository.create(data)
          createdPayments.push(payment)
        }

        /**
         * =========================
         * Audit log SUCCESS
         * =========================
         */
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.TUITION_PAYMENT.CREATE_BULK,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
            afterData: {
              courseId: dto.courseId,
              month: dto.month,
              year: dto.year,
              createdCount: createdPayments.length,
              createdPaymentIds: createdPayments.map((p) => p.paymentId),
            },
            beforeData: {
              requestedStudentIds: studentIds,
              existingStudentIds: Array.from(existingStudentIds),
            },
          })
        }

        // Gửi thông báo cho học sinh
        if (createdPayments.length > 0) {
          const createdStudentIds = createdPayments.map((p) => p.studentId)
          const students: { studentId: number; userId: number }[] = []
          for (const sid of createdStudentIds) {
            const student = await studentRepository.findById(sid)
            if (student) students.push({ studentId: student.studentId, userId: student.userId })
          }

          if (students.length > 0) {
            const statusLabel = dto.status ? (TuitionPaymentStatusLabels[dto.status] || dto.status) : 'Chưa nộp'
            const notificationDataList = students.map((s) => {
              const payment = createdPayments.find((p) => p.studentId === s.studentId)
              return {
                userId: s.userId,
                title: 'Học phí mới',
                message: `Học phí tháng ${dto.month}/${dto.year} đã được tạo - Số tiền: ${payment?.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${statusLabel}`,
                type: NotificationType.TUITION,
                level: NotificationLevel.INFO,
                data: { paymentId: payment?.paymentId, amount: payment?.amount, month: dto.month, year: dto.year, status: dto.status },
              }
            })
            this.createAndNotifyMany.execute(notificationDataList).catch(() => { /* ignore notification error */ })
          }
        }

        return createdPayments.map((p) => TuitionPaymentResponseDto.fromEntity(p))
      } catch (error) {
        /**
         * =========================
         * Audit log FAIL
         * =========================
         */
        if (adminId) {
          await adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.TUITION_PAYMENT.CREATE_BULK,
            status: AuditStatus.FAIL,
            resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
        }
        throw error
      }
    })

    return BaseResponseDto.success('Tạo học phí hàng loạt thành công', result)
  }
}
