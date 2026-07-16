/** Application port and Nest injection token for ExcelService. */
export abstract class ExcelService {}

export interface ExcelService {
  exportToBuffer(...args: any[]): any
  exportToStream(...args: any[]): any
  parseFromBuffer(...args: any[]): any
  parseFromStream(...args: any[]): any
  createTemplate(...args: any[]): any
  isValidExcelFile(...args: any[]): any
  getSheetNames(...args: any[]): any
  countRows(...args: any[]): any
}
export interface ExcelColumn { header: string; key: string; width?: number; style?: any }

