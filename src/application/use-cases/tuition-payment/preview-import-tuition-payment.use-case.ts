import { Injectable, Inject } from '@nestjs/common'
import { ExcelService } from 'src/infrastructure/services'
import {
  BaseResponseDto,
  TuitionPaymentImportPreviewResponse,
} from 'src/application/dtos'
import type {
  IStudentRepository,
  ITuitionPaymentRepository,
} from 'src/domain/repositories'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
import { TuitionPaymentStatus } from 'src/shared/enums'

@Injectable()
export class PreviewImportTuitionPaymentUseCase {
  constructor(
    private readonly excelService: ExcelService,

    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,

    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) { }

  /**
   * Helper: Strip time from date (set to 00:00:00)
   */
  private getDateWithoutTime(date: Date = new Date()): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  async execute(
    file: Express.Multer.File,
  ): Promise<BaseResponseDto<TuitionPaymentImportPreviewResponse>> {
    /* =====================================================
     * 0. Validate file
     * ===================================================== */
    if (!file?.buffer) {
      throw new ConflictException('File excel không hợp lệ')
    }

    /* =====================================================
     * 1. Parse excel
     * ===================================================== */
    const parsed = await this.excelService.parseFromBuffer(file.buffer, {
      expectedColumns: [
        'Họ tên',
        'Học phí',
        'Tháng',
        'Năm',
        'Đã đóng',
        'Ngày đóng',
        'Ghi chú',
        'SĐT học sinh',
        'SĐT phụ huynh',
      ],
    })

    const invalidRows: any[] = []
    const newPayments: any[] = []
    const existingPayments: any[] = []
    const unchangedPayments: any[] = []

    /* =====================================================
     * 2. Process từng dòng
     * ===================================================== */
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const rowNumber = i + 2 // header là dòng 1

      const fullName = row['Họ tên']?.toString().trim() || ''
      const { firstName, lastName } = this.splitFullName(fullName)

      const studentPhone = row['SĐT học sinh']?.toString().trim() || ''
      const parentPhone = row['SĐT phụ huynh']?.toString().trim() || ''

      const amount = Number(row['Học phí']) || 0
      const month = Number(row['Tháng']) || null
      const year = Number(row['Năm']) || null

      /* ================= VALIDATE ================= */
      if (!firstName || !lastName || !month || !year) {
        invalidRows.push({
          rowNumber,
          reason: 'INVALID_DATA',
          message: 'Thiếu họ tên / tháng / năm',
          rawData: row,
        })
        continue
      }

      if (!studentPhone && !parentPhone) {
        invalidRows.push({
          rowNumber,
          reason: 'MISSING_PHONE',
          message: 'Thiếu SĐT học sinh hoặc phụ huynh',
          rawData: row,
        })
        continue
      }

      /* ================= PAID STATUS ================= */
      const paidRaw = String(row['Đã đóng'] ?? '').toLowerCase()
      const isPaid = ['true', '1', 'x', '✔'].includes(paidRaw)

      const notes = row['Ghi chú']?.toString().trim() || ''

      const paymentPayload = {
        amount,
        month,
        year,
        status: isPaid
          ? TuitionPaymentStatus.PAID
          : TuitionPaymentStatus.UNPAID,
        paidAt: isPaid
          ? row['Ngày đóng']
            ? this.getDateWithoutTime(new Date(row['Ngày đóng']))
            : this.getDateWithoutTime()
          : null,
        notes,
      }

      /* =====================================================
       * 3. Find student
       * ===================================================== */
      const student = await this.studentRepository.findOneByFilters({
        firstName,
        lastName,
        studentPhone,
        parentPhone,
      })

      if (!student) {
        invalidRows.push({
          rowNumber,
          reason: 'STUDENT_NOT_FOUND',
          message: 'Không tìm thấy học sinh trong hệ thống',
          rawData: {
            fullName,
            studentPhone,
            parentPhone,
          },
        })
        continue
      }

      const studentInfo = {
        studentId: student.studentId,
        fullName: `${student.user?.lastName} ${student.user?.firstName}`,
        studentPhone: student.studentPhone,
        parentPhone: student.parentPhone,
      }

      /* =====================================================
       * 4. Find existing payment
       * ===================================================== */
      const existedPayment =
        await this.tuitionPaymentRepository.findByStudentAndPeriod(
          student.studentId,
          month,
          year,
        )

      if (!existedPayment) {
        /* ================= NEW PAYMENT ================= */
        newPayments.push({
          rowNumber,
          student: studentInfo,
          payment: paymentPayload,
          month,
          year,
          amount,
        })
        continue
      }

      /* ================= EXISTED PAYMENT ================= */
      const oldPayment = {
        paymentId: existedPayment.paymentId,
        amount: existedPayment.amount,
        status: existedPayment.status,
        paidAt: existedPayment.paidAt,
        month: existedPayment.month,
        year: existedPayment.year,
        notes: existedPayment.notes,
      }

      const isSame = this.isSamePayment(oldPayment, paymentPayload)

      if (isSame) {
        unchangedPayments.push({
          rowNumber,
          tuitionPaymentId: existedPayment.paymentId,
          amount: existedPayment.amount,
          student: studentInfo,
          payment: oldPayment,
        })
      } else {
        existingPayments.push({
          rowNumber,
          tuitionPaymentId: existedPayment.paymentId,
          amount: existedPayment.amount,
          student: studentInfo,
          oldPayment,
          newPayment: paymentPayload,
        })
      }
    }

    /* =====================================================
     * 5. Build response
     * ===================================================== */
    const response: TuitionPaymentImportPreviewResponse = {
      summary: {
        totalRows: parsed.totalRows,
        validRows:
          newPayments.length +
          existingPayments.length +
          unchangedPayments.length,
        newPayments: newPayments.length,
        existingPayments: existingPayments.length,
        unchangedPayments: unchangedPayments.length,
        invalidRows: invalidRows.length,
      },
      newPayments,
      existingPayments,
      unchangedPayments,
      invalidRows,
    }

    return BaseResponseDto.success(
      'Preview import học phí thành công',
      response,
    )
  }

  /* =====================================================
   * Helpers
   * ===================================================== */

  private splitFullName(fullName: string): {
    firstName: string
    lastName: string
  } {
    const parts = fullName.trim().replace(/\s+/g, ' ').split(' ')

    if (parts.length <= 1) {
      return { firstName: parts[0] || '', lastName: '' }
    }

    return {
      firstName: parts[parts.length - 1],
      lastName: parts.slice(0, -1).join(' '),
    }
  }

  private isSamePayment(oldPayment: any, newPayment: any): boolean {
    const sameAmount =
      Number(oldPayment.amount) === Number(newPayment.amount)

    const sameStatus = oldPayment.status === newPayment.status

    const samePaidAt =
      (!oldPayment.paidAt && !newPayment.paidAt) ||
      (oldPayment.paidAt &&
        newPayment.paidAt &&
        new Date(oldPayment.paidAt).getTime() ===
        new Date(newPayment.paidAt).getTime())

    return sameAmount && sameStatus && samePaidAt
  }
}
