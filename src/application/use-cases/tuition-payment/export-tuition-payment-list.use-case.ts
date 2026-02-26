import { Injectable, Inject } from '@nestjs/common'
import type { ITuitionPaymentRepository } from '../../../domain/repositories/tuition-payment.repository'
import { ExcelService, ExcelColumn } from '../../../infrastructure/services/excel.service'
import { ExportTuitionPaymentListOptionDto } from '../../dtos/tuition-payment/export-tuition-payment-list-option.dto'
import { TuitionPaymentStatus } from '@prisma/client'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

@Injectable()
export class ExportTuitionPaymentListUseCase {
    constructor(
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
        private readonly excelService: ExcelService,
    ) { }

    async execute(
        options: ExportTuitionPaymentListOptionDto,
    ): Promise<{
        buffer: Buffer
        filename: string
    }> {
        const filters = options.toTuitionPaymentFilterOptions()

        const pagination = {
            page: options.page || 1,
            limit: options.limit || 1000, // Default limit cao hơn cho export
            sortBy: options.sortBy || 'createdAt',
            sortOrder: options.sortOrder || SortOrder.DESC,
        }

        const result = await this.tuitionPaymentRepository.findAllWithPagination(pagination, filters)

        // Build data for Excel
        const excelData = result.data.map((payment, index) => {
            const data: any = {
                stt: index + 1,
                paymentId: payment.paymentId || '',
            }

            if (options.includeStudentName !== false) {
                const lastName = payment.student?.user?.lastName || ''
                const firstName = payment.student?.user?.firstName || ''
                data.studentName = `${lastName} ${firstName}`.trim()
            }

            if (options.includeStudentPhone !== false) {
                data.studentPhone = payment.student?.studentPhone || ''
            }

            if (options.includeParentPhone !== false) {
                data.parentPhone = payment.student?.parentPhone || ''
            }

            if (options.includeSchool !== false) {
                data.school = payment.student?.school || ''
            }

            if (options.includeGrade !== false) {
                data.grade = payment.student?.grade || ''
            }

            if (options.includeAmount !== false) {
                data.amount = payment.amount || 0
            }

            if (options.includeMonth !== false) {
                data.month = payment.month || ''
            }

            if (options.includeYear !== false) {
                data.year = payment.year || ''
            }

            if (options.includeStatus !== false) {
                data.status = payment.status === TuitionPaymentStatus.PAID ? 'Đã đóng' : 'Chưa đóng'
            }

            if (options.includePaidAt !== false) {
                data.paidAt = payment.paidAt ? this.formatDate(payment.paidAt) : ''
            }

            if (options.includeNotes === true) {
                data.notes = payment.notes || ''
            }

            if (options.includeCreatedAt !== false) {
                data.createdAt = this.formatDateTime(payment.createdAt)
            }

            return data
        })

        const filename = `Danh_sach_hoc_phi_${this.formatDateTime(new Date()).replace(
            /[/ :]/g,
            '_',
        )}.xlsx`

        // Build columns
        const columns = this.buildColumns(options)

        const buffer = await this.excelService.exportToBuffer({
            sheetName: 'Học phí',
            columns,
            data: excelData,
        })

        return { buffer, filename }
    }

    // ================= Helpers =================

    private formatDateTime(date: Date): string {
        if (!date) return ''
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    }

    private formatDate(date: Date): string {
        if (!date) return ''
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
    }

    private buildColumns(options: ExportTuitionPaymentListOptionDto): ExcelColumn[] {
        const columns: ExcelColumn[] = [
            { header: 'STT', key: 'stt', width: 8 },
            { header: 'Mã học phí', key: 'paymentId', width: 12 },
        ]

        if (options.includeStudentName !== false) {
            columns.push({ header: 'Học sinh', key: 'studentName', width: 25 })
        }

        if (options.includeStudentPhone !== false) {
            columns.push({ header: 'SĐT học sinh', key: 'studentPhone', width: 15 })
        }

        if (options.includeParentPhone !== false) {
            columns.push({ header: 'SĐT phụ huynh', key: 'parentPhone', width: 15 })
        }

        if (options.includeSchool !== false) {
            columns.push({ header: 'Trường', key: 'school', width: 25 })
        }

        if (options.includeGrade !== false) {
            columns.push({ header: 'Khối', key: 'grade', width: 10 })
        }

        if (options.includeAmount !== false) {
            columns.push({ header: 'Số tiền', key: 'amount', width: 15 })
        }

        if (options.includeMonth !== false) {
            columns.push({ header: 'Tháng', key: 'month', width: 10 })
        }

        if (options.includeYear !== false) {
            columns.push({ header: 'Năm', key: 'year', width: 10 })
        }

        if (options.includeStatus !== false) {
            columns.push({ header: 'Trạng thái', key: 'status', width: 15 })
        }

        if (options.includePaidAt !== false) {
            columns.push({ header: 'Ngày đóng', key: 'paidAt', width: 15 })
        }

        if (options.includeNotes === true) {
            columns.push({ header: 'Ghi chú', key: 'notes', width: 30 })
        }

        if (options.includeCreatedAt !== false) {
            columns.push({ header: 'Ngày tạo', key: 'createdAt', width: 20 })
        }

        return columns
    }
}
