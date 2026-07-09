import { ExcelColumn } from 'src/infrastructure/services/excel.service'

export const ACHIEVEMENT_ROW_EXCEL_HEADERS = ['Ten hoc sinh', 'Truong', 'Khoi', 'Diem']

export const ACHIEVEMENT_ROW_EXCEL_COLUMNS: ExcelColumn[] = [
  { header: 'Ten hoc sinh', key: 'studentName', width: 28 },
  { header: 'Truong', key: 'schoolName', width: 32 },
  { header: 'Khoi', key: 'grade', width: 12 },
  { header: 'Diem', key: 'score', width: 14 },
]
