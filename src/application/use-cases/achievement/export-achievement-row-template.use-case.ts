import { Injectable } from '@nestjs/common'
import { ExcelService } from 'src/infrastructure/services'
import { ACHIEVEMENT_ROW_EXCEL_COLUMNS } from './achievement-excel.constants'

@Injectable()
export class ExportAchievementRowTemplateUseCase {
  constructor(private readonly excelService: ExcelService) {}

  async execute(): Promise<{ buffer: Buffer; filename: string }> {
    const buffer = await this.excelService.exportToBuffer({
      sheetName: 'Thanh tich',
      columns: ACHIEVEMENT_ROW_EXCEL_COLUMNS,
      data: [
        {
          studentName: 'Nguyen Van A',
          schoolName: 'THCS Nguyen Du',
          grade: 9,
          score: 18.5,
        },
      ],
    })

    return {
      buffer,
      filename: 'achievement-row-template.xlsx',
    }
  }
}
