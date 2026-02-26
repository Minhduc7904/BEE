import { Injectable } from '@nestjs/common'
import { ExcelService, ExcelColumn } from 'src/infrastructure/services/excel.service'
import { ExportExcelTuitionPaymentExampleQueryDto } from '../../dtos/tuition-payment/export-excel-tuition-payment-example-query.dto'

@Injectable()
export class ExportExcelTuitionPaymentExampleUseCase {
    constructor(
        private readonly excelService: ExcelService,
    ) { }

    async execute(
        query: ExportExcelTuitionPaymentExampleQueryDto,
    ): Promise<{
        buffer: Buffer
        filename: string
    }> {
        const { month, year } = query

        /* ===================== 1. Data mẫu ===================== */
        const excelData = this.buildData(month, year)

        /* ===================== 2. Columns ===================== */
        const columns = this.buildColumns()

        /* ===================== 3. Export ===================== */
        const buffer = await this.excelService.exportToBuffer({
            sheetName: 'Học phí mẫu',
            columns,
            data: excelData,
        })

        return {
            buffer,
            filename: `Hoc_phi_mau_${month}_${year}.xlsx`,
        }
    }

    /* ===================== DATA ===================== */
    private buildData(month: number, year: number) {
        return Array.from({ length: 100 }).map((_, index) => ({
            fullName: '',
            amount: '',
            isPaid: false, // ✅ luôn FALSE
            paidAt: '',
            studentPhone: '',
            parentPhone: '',
            month,
            year,
            notes: '',
        }))
    }

    /* ===================== COLUMNS ===================== */
    private buildColumns(): ExcelColumn[] {
        return [
            { header: 'Họ tên', key: 'fullName', width: 25 },
            { header: 'Học phí', key: 'amount', width: 15 },
            { header: 'Đã đóng', key: 'isPaid', width: 12 },
            { header: 'Ngày đóng', key: 'paidAt', width: 15 },
            { header: 'SĐT học sinh', key: 'studentPhone', width: 18 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 18 },
            { header: 'Tháng', key: 'month', width: 10 },
            { header: 'Năm', key: 'year', width: 10 },
            { header: 'Ghi chú', key: 'notes', width: 30 },
        ]
    }
}
