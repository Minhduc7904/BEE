import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto } from 'src/application/dtos'
import { CreateArrayBulkTuitionPaymentDto } from 'src/application/dtos/tuition-payment/create-array-bulk-tuition-payment.dto'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ValidationException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { AuditStatus } from 'src/shared/enums'
import { RESOURCE_TYPES, ACTION_KEYS } from 'src/shared/constants'
import { CreateTuitionPaymentData } from 'src/domain/interface'
import { TuitionPayment } from 'src/domain/entities/tuition-payment/tuition-payment.entity'

@Injectable()
export class CreateArrayBulkTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * Helper: Strip time from date (set to 00:00:00)
   */
  private getDateWithoutTime(date: Date = new Date()): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  async execute(
    dto: CreateArrayBulkTuitionPaymentDto,
    adminId: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto[]>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const {
        tuitionPaymentRepository,
        adminAuditLogRepository,
        studentRepository,
        courseRepository,
      } = repos

      try {
        /**
         * =========================
         * Validate students exist
         * =========================
         */
        const studentIds = dto.payments.map((p) => p.studentId)
        const uniqueStudentIds = [...new Set(studentIds)]
        
        for (const studentId of uniqueStudentIds) {
          const student = await studentRepository.findById(studentId)
          if (!student) {
            throw new NotFoundException(`Học sinh với ID ${studentId} không tồn tại`)
          }
        }

        /**
         * =========================
         * Validate courses if provided
         * =========================
         */
        const courseIds = dto.payments
          .map((p) => p.courseId)
          .filter((id): id is number => id !== undefined && id !== null)
        const uniqueCourseIds = [...new Set(courseIds)]

        for (const courseId of uniqueCourseIds) {
          const course = await courseRepository.findById(courseId)
          if (!course) {
            throw new NotFoundException(`Khóa học với ID ${courseId} không tồn tại`)
          }
        }

        /**
         * =========================
         * Check for duplicates
         * =========================
         */
        const existingPayments = await tuitionPaymentRepository.findWithFilter({})
        const existingSet = new Set(
          existingPayments.map(
            (p) => `${p.studentId}-${p.month}-${p.year}-${p.courseId || 'null'}`,
          ),
        )

        const results: { created: TuitionPayment[]; skipped: any[] } = {
          created: [],
          skipped: [],
        }

        /**
         * =========================
         * Create payments
         * =========================
         */
        for (const paymentData of dto.payments) {
          const key = `${paymentData.studentId}-${paymentData.month}-${paymentData.year}-${paymentData.courseId || 'null'}`

          if (existingSet.has(key)) {
            results.skipped.push({
              studentId: paymentData.studentId,
              month: paymentData.month,
              year: paymentData.year,
              reason: 'Học phí đã tồn tại',
            })
            continue
          }

          const createData: CreateTuitionPaymentData = {
            studentId: paymentData.studentId,
            amount: paymentData.amount,
            month: paymentData.month,
            year: paymentData.year,
            status: paymentData.status,
            notes: paymentData.notes,
            paidAt: paymentData.paidAt ? this.getDateWithoutTime(paymentData.paidAt) : undefined,
            courseId: paymentData.courseId,
          }

          const payment = await tuitionPaymentRepository.create(createData)
          results.created.push(payment)
          existingSet.add(key) // Prevent duplicates within the same batch
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
              createdCount: results.created.length,
              skippedCount: results.skipped.length,
              createdPaymentIds: results.created.map((p) => p.paymentId),
              skippedDetails: results.skipped,
            },
            beforeData: {
              requestedCount: dto.payments.length,
            },
          })
        }

        return results.created.map((p) => TuitionPaymentResponseDto.fromEntity(p))
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
