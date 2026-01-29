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

@Injectable()
export class PreviewImportTuitionPaymentUseCase {
  constructor(
    private readonly excelService: ExcelService,

    @Inject('IStudentRepository')
    private readonly studentRepository: IStudentRepository,

    @Inject('ITuitionPaymentRepository')
    private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
  ) {}

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
        'SĐT học sinh',
        'SĐT phụ huynh',
      ],
    })

    const invalidRows: any[] = []
    const existingPayments: any[] = []
    const newPayments: any[] = []

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

      /* ================= VALIDATE CƠ BẢN ================= */
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

      const paidRaw = String(row['Đã đóng'] ?? '').toLowerCase()
      const isPaid = ['true', '1', 'x', '✔'].includes(paidRaw)

      /* =====================================================
       * 3. Tìm student
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

      /* =====================================================
       * 4. Tìm học phí theo student + month + year
       * ===================================================== */
      const existedPayment =
        await this.tuitionPaymentRepository.findByStudentAndPeriod(
          student.studentId,
          month,
          year,
        )

      const paymentPayload = {
        amount,
        month,
        year,
        status: isPaid ? 'PAID' : 'UNPAID',
        paidAt: isPaid
          ? row['Ngày đóng']
            ? new Date(row['Ngày đóng'])
            : new Date()
          : null,
      }

      if (existedPayment) {
        existingPayments.push({
          rowNumber,
          tuitionPaymentId: existedPayment.paymentId,
          student: {
            studentId: student.studentId,
            fullName: `${student.user?.lastName} ${student.user?.firstName}`,
          },
          oldPayment: {
            amount: existedPayment.amount,
            status: existedPayment.status,
            paidAt: existedPayment.paidAt,
          },
          newPayment: paymentPayload,
        })
      } else {
        newPayments.push({
          rowNumber,
          student: {
            studentId: student.studentId,
            fullName: `${student.user?.lastName} ${student.user?.firstName}`,
          },
          payment: paymentPayload,
        })
      }
    }

    /* =====================================================
     * 5. Build response
     * ===================================================== */
    const response: TuitionPaymentImportPreviewResponse = {
      summary: {
        totalRows: parsed.totalRows,
        validRows: existingPayments.length + newPayments.length,
        existingPayments: existingPayments.length,
        newPayments: newPayments.length,
        invalidRows: invalidRows.length,
      },
      existingPayments,
      newPayments,
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
}
