import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { ExcelService, ExcelColumn } from 'src/infrastructure/services/excel.service'
import { ExportExcelTuitionPaymentExampleQueryDto } from '../../dtos/tuition-payment/export-excel-tuition-payment-example-query.dto'

@Injectable()
export class ExportExcelTuitionPaymentExampleUseCase {
    constructor(
        private readonly excelService: ExcelService,
    ) {}

    async execute(
        query: ExportExcelTuitionPaymentExampleQueryDto,
    ): Promise<{
        buffer: Buffer
        filename: string
    }> {
        const { month, year } = query

        /* ===================== 1. Data mẫu ===================== */
        const data = Array.from({ length: 100 }).map((_, index) => ({
            stt: index + 1,
            fullName: '',
            amount: '',
            month,
            year,
            isPaid: false,
            paidAt: '',
            studentPhone: '',
            parentPhone: '',
        }))

        /* ===================== 2. Columns ===================== */
        const columns: ExcelColumn[] = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Họ tên', key: 'fullName', width: 25 },
            { header: 'Học phí', key: 'amount', width: 15 },
            { header: 'Tháng', key: 'month', width: 10 },
            { header: 'Năm', key: 'year', width: 10 },
            { header: 'Đã đóng', key: 'isPaid', width: 12 },
            { header: 'Ngày đóng', key: 'paidAt', width: 15 },
            { header: 'SĐT học sinh', key: 'studentPhone', width: 18 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 18 },
        ]

        /* ===================== 3. Tạo workbook thủ công ===================== */
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Học phí mẫu')

        worksheet.columns = columns.map(c => ({
            header: c.header,
            key: c.key,
            width: c.width || 15,
        }))

        data.forEach(row => worksheet.addRow(row))

        /* ===================== 4. Add CHECKBOX cho cột "Đã đóng" ===================== */
        const isPaidColumnIndex = columns.findIndex(c => c.key === 'isPaid') + 1
        const startRow = 2
        const endRow = data.length + 1

        for (let row = startRow; row <= endRow; row++) {
            const cell = worksheet.getCell(row, isPaidColumnIndex)

            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['TRUE,FALSE'],
            }

            cell.value = false
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
        }

        /* ===================== 5. Header style + freeze ===================== */
        worksheet.getRow(1).font = { bold: true }
        worksheet.views = [{ state: 'frozen', ySplit: 1 }]
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: columns.length },
        }

        /* ===================== 6. Export ===================== */
        const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

        const filename = `Hoc_phi_mau_${month}_${year}.xlsx`

        return { buffer, filename }
    }
}
