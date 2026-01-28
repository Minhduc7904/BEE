import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { Readable } from 'stream'

/**
 * ExcelService - Production-ready Excel file processing service
 *
 * FEATURES:
 * - Export data to Excel (XLSX format)
 * - Import and parse Excel files
 * - Support both Buffer and Stream
 * - Customizable styling and formatting
 * - Type-safe data handling
 * - Error handling and validation
 *
 * ARCHITECTURE:
 * - Pure utility service (no business logic)
 * - Stream-based for large files
 * - Memory-efficient processing
 * - Extensible and reusable
 */

export interface ExcelColumn {
  /** Column header */
  header: string
  /** Property key in data object */
  key: string
  /** Column width (default: 15) */
  width?: number
  /** Custom cell style */
  style?: Partial<ExcelJS.Style>
}

export interface ExcelExportOptions {
  /** Sheet name (default: 'Sheet1') */
  sheetName?: string
  /** Columns configuration */
  columns: ExcelColumn[]
  /** Data rows */
  data: any[]
  /** Apply header styling (default: true) */
  applyHeaderStyle?: boolean
  /** Custom header style */
  headerStyle?: Partial<ExcelJS.Style>
  /** Auto-filter enabled (default: true) */
  autoFilter?: boolean
  /** Freeze first row (default: true) */
  freezeRow?: boolean
}

export interface ExcelImportOptions {
  /** Expected columns (for validation) */
  expectedColumns?: string[]
  /** Sheet name to read (default: first sheet) */
  sheetName?: string
  /** Skip header row (default: true) */
  skipHeader?: boolean
  /** Trim cell values (default: true) */
  trimValues?: boolean
}

export interface ParsedExcelData {
  /** Parsed rows as objects */
  data: any[]
  /** Total rows parsed */
  totalRows: number
  /** Column headers */
  headers: string[]
}

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name)

  // ==================== EXPORT OPERATIONS ====================

  /**
   * Export data to Excel file as Buffer
   * Suitable for immediate download or API response
   *
   * @param options - Export configuration
   * @returns Excel file buffer
   */
  async exportToBuffer(options: ExcelExportOptions): Promise<Buffer> {
    try {
      const workbook = await this.createWorkbook(options)
      const buffer = await workbook.xlsx.writeBuffer()

      this.logger.log(`✅ Excel exported to buffer: ${options.data.length} rows`)
      return Buffer.from(buffer)
    } catch (error) {
      this.logger.error(`❌ Export to buffer failed: ${error.message}`)
      throw new InternalServerErrorException(`Failed to export Excel: ${error.message}`)
    }
  }

  /**
   * Export data to Excel file as Stream
   * Suitable for large datasets to prevent memory issues
   *
   * @param options - Export configuration
   * @returns Excel file stream
   */
  async exportToStream(options: ExcelExportOptions): Promise<Readable> {
    try {
      const workbook = await this.createWorkbook(options)
      const stream = new Readable({ read() {} })

      workbook.xlsx.write(stream).then(() => {
        stream.push(null) // kết thúc stream
      })

      return stream
    } catch (error) {
      this.logger.error(`❌ Export to stream failed: ${error.message}`)
      throw new InternalServerErrorException(`Failed to export Excel stream: ${error.message}`)
    }
  }

  /**
   * Create and configure workbook with data
   * Internal helper method
   */
  private async createWorkbook(options: ExcelExportOptions): Promise<ExcelJS.Workbook> {
    const {
      sheetName = 'Sheet1',
      columns,
      data,
      applyHeaderStyle = true,
      headerStyle,
      autoFilter = true,
      freezeRow = true,
    } = options

    // Validate inputs
    if (!columns || columns.length === 0) {
      throw new BadRequestException('Columns configuration is required')
    }

    if (!Array.isArray(data)) {
      throw new BadRequestException('Data must be an array')
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'BEE System'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet(sheetName)

    // Configure columns
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      style: col.style,
    }))

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    // Apply header styling
    if (applyHeaderStyle) {
      const defaultHeaderStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        },
      }

      const finalHeaderStyle = headerStyle || defaultHeaderStyle

      // Apply to header row
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = finalHeaderStyle as any
      })
      worksheet.getRow(1).height = 20
    }

    // Enable auto-filter
    if (autoFilter && data.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      }
    }

    // Freeze header row
    if (freezeRow) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    }

    return workbook
  }

  // ==================== IMPORT OPERATIONS ====================

  /**
   * Parse Excel file from Buffer
   *
   * @param buffer - Excel file buffer
   * @param options - Import configuration
   * @returns Parsed data
   */
  async parseFromBuffer(buffer: Buffer, options?: ExcelImportOptions): Promise<ParsedExcelData> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer as any)

      return this.extractDataFromWorkbook(workbook, options)
    } catch (error) {
      this.logger.error(`❌ Parse from buffer failed: ${error.message}`)
      throw new BadRequestException(`Failed to parse Excel file: ${error.message}`)
    }
  }

  /**
   * Parse Excel file from Stream
   *
   * @param stream - Excel file stream
   * @param options - Import configuration
   * @returns Parsed data
   */
  async parseFromStream(stream: Readable, options?: ExcelImportOptions): Promise<ParsedExcelData> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.read(stream)

      return this.extractDataFromWorkbook(workbook, options)
    } catch (error) {
      this.logger.error(`❌ Parse from stream failed: ${error.message}`)
      throw new BadRequestException(`Failed to parse Excel stream: ${error.message}`)
    }
  }

  /**
   * Extract data from workbook
   * Internal helper method
   */
  private extractDataFromWorkbook(workbook: ExcelJS.Workbook, options?: ExcelImportOptions): ParsedExcelData {
    const { expectedColumns, sheetName, skipHeader = true, trimValues = true } = options || {}

    // Get worksheet
    const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0]

    if (!worksheet) {
      throw new BadRequestException('Worksheet not found')
    }

    const data: any[] = []
    const headers: string[] = []
    let headerRow: ExcelJS.Row | null = null

    // Process rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Extract headers
        headerRow = row
        row.eachCell((cell, colNumber) => {
          const value = this.getCellValue(cell, trimValues)
          headers.push(value)
        })

        // Validate expected columns
        if (expectedColumns && expectedColumns.length > 0) {
          this.validateHeaders(headers, expectedColumns)
        }

        // Skip header if configured
        if (skipHeader) {
          return
        }
      }

      // Process data rows
      if (rowNumber > 1 || !skipHeader) {
        const rowData: any = {}
        let isEmpty = true

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1]
          const value = this.getCellValue(cell, trimValues)

          if (header) {
            rowData[header] = value
            if (value !== null && value !== undefined && value !== '') {
              isEmpty = false
            }
          }
        })

        // Only add non-empty rows
        if (!isEmpty) {
          data.push(rowData)
        }
      }
    })

    this.logger.log(`✅ Excel parsed: ${data.length} rows, ${headers.length} columns`)

    return {
      data,
      totalRows: data.length,
      headers,
    }
  }

  /**
   * Get cell value with proper type conversion
   */
  private getCellValue(cell: ExcelJS.Cell, trim = true): any {
    let value = cell.value

    // Handle formula cells
    if (cell.type === ExcelJS.ValueType.Formula) {
      value = cell.result
    }

    // Handle rich text
    if (cell.type === ExcelJS.ValueType.RichText) {
      value = (cell.value as any).richText.map((rt: any) => rt.text).join('')
    }

    // Convert to string and trim if needed
    if (typeof value === 'string' && trim) {
      value = value.trim()
    }

    // Handle dates
    if (cell.type === ExcelJS.ValueType.Date) {
      value = cell.value
    }

    return value
  }

  /**
   * Validate headers against expected columns
   */
  private validateHeaders(headers: string[], expectedColumns: string[]): void {
    const missingColumns = expectedColumns.filter((col) => !headers.includes(col))

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns.join(', ')}. Expected: ${expectedColumns.join(', ')}`,
      )
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Create a simple Excel template with headers only
   * Useful for import templates
   *
   * @param headers - Column headers
   * @param sheetName - Sheet name
   * @returns Excel buffer
   */
  async createTemplate(headers: string[], sheetName = 'Template'): Promise<Buffer> {
    try {
      const columns = headers.map((header) => ({
        header,
        key: header.toLowerCase().replace(/\s+/g, '_'),
        width: 20,
      }))

      return await this.exportToBuffer({
        sheetName,
        columns,
        data: [],
        applyHeaderStyle: true,
      })
    } catch (error) {
      this.logger.error(`❌ Create template failed: ${error.message}`)
      throw new InternalServerErrorException(`Failed to create template: ${error.message}`)
    }
  }

  /**
   * Validate Excel file (check if it's a valid XLSX file)
   *
   * @param buffer - File buffer
   * @returns True if valid
   */
  async isValidExcelFile(buffer: Buffer): Promise<boolean> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer as any)
      return workbook.worksheets.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Get worksheet names from Excel file
   *
   * @param buffer - Excel file buffer
   * @returns Array of sheet names
   */
  async getSheetNames(buffer: Buffer): Promise<string[]> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer as any)
      return workbook.worksheets.map((ws) => ws.name)
    } catch (error) {
      this.logger.error(`❌ Get sheet names failed: ${error.message}`)
      throw new BadRequestException('Failed to read Excel file')
    }
  }

  /**
   * Count rows in Excel file
   *
   * @param buffer - Excel file buffer
   * @param sheetName - Optional sheet name
   * @returns Row count
   */
  async countRows(buffer: Buffer, sheetName?: string): Promise<number> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer as any)

      const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0]

      if (!worksheet) {
        throw new BadRequestException('Worksheet not found')
      }

      return worksheet.rowCount
    } catch (error) {
      this.logger.error(`❌ Count rows failed: ${error.message}`)
      throw new BadRequestException('Failed to count rows')
    }
  }
}
