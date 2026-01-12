import { Inject, Injectable } from '@nestjs/common'
import type { IAttendanceRepository } from 'src/domain/repositories/attendance.repository'
import { ExcelService, ExcelColumn } from '../../../infrastructure/services/excel.service'
import { NotFoundException } from '@nestjs/common'
import { ExportAttendanceOptionsDto } from '../../dtos/attendance/export-attendance-options.dto'

@Injectable()
export class ExportAttendanceBySessionUseCase {
  constructor(
    @Inject('IAttendanceRepository')
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly excelService: ExcelService,
  ) {}

  async execute(
    sessionId: number,
    options: ExportAttendanceOptionsDto = new ExportAttendanceOptionsDto(),
  ): Promise<{
    buffer: Buffer
    filename: string
  }> {
    // Lấy tất cả attendance theo sessionId
    const result = await this.attendanceRepository.findAllWithPagination({ page: 1, limit: 999999 }, { sessionId })

    if (result.total === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu điểm danh cho buổi học này')
    }

    // Chuẩn bị dữ liệu cho Excel
    const excelData = result.data.map((attendance, index) => ({
      stt: index + 1,
      studentCode: attendance.student?.studentId || '',
      lastName: attendance.student?.user.lastName || '',
      firstName: attendance.student?.user.firstName || '',
      school: attendance.student?.school || '',
      parentPhone: attendance.student?.parentPhone || '',
      studentPhone: attendance.student?.studentPhone || '',
      grade: attendance.student?.grade || '',
      email: attendance.student?.user.email || '',
      status: attendance.getStatusLabel(),
      markedAt: this.formatDate(attendance.markedAt),
      notes: attendance.notes || '',
      makeupNote: attendance.makeupNote || '',
      markerName: attendance.getMarkerName() || '',
    }))

    // Lấy thông tin session để đặt tên file
    const sessionInfo = result.data[0]?.classSession
    const sessionName = sessionInfo
      ? `Buoi_${sessionInfo.sessionNumber}_Ngay_${this.formatDateForFilename(sessionInfo.sessionDate)}`
      : `Session_${sessionId}`

    // Build columns dynamically based on options
    const columns = this.buildColumns(options)

    // Export Excel
    const buffer = await this.excelService.exportToBuffer({
      sheetName: 'Điểm danh',
      columns,
      data: excelData,
    })

    return {
      buffer,
      filename: `DanhSach_DiemDanh_${sessionName}.xlsx`,
    }
  }

  /**
   * Build columns based on export options
   */
  private buildColumns(options: ExportAttendanceOptionsDto): ExcelColumn[] {
    const columns: ExcelColumn[] = [
      // Default columns (always included)
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã học sinh', key: 'studentCode', width: 15 },
      { header: 'Họ', key: 'lastName', width: 20 },
      { header: 'Tên', key: 'firstName', width: 15 },
    ]

    // Optional columns
    if (options.includeSchool !== false) {
      columns.push({ header: 'Trường', key: 'school', width: 25 })
    }

    if (options.includeParentPhone !== false) {
      columns.push({ header: 'SĐT phụ huynh', key: 'parentPhone', width: 15 })
    }

    if (options.includeStudentPhone === true) {
      columns.push({ header: 'SĐT học sinh', key: 'studentPhone', width: 15 })
    }

    if (options.includeGrade !== false) {
      columns.push({ header: 'Lớp', key: 'grade', width: 10 })
    }

    if (options.includeEmail !== false) {
      columns.push({ header: 'Email', key: 'email', width: 25 })
    }

    // Status is always included after optional fields
    columns.push({ header: 'Trạng thái', key: 'status', width: 15 })

    if (options.includeMarkedAt !== false) {
      columns.push({ header: 'Thời gian điểm danh', key: 'markedAt', width: 20 })
    }

    if (options.includeNotes !== false) {
      columns.push({ header: 'Ghi chú', key: 'notes', width: 30 })
    }

    if (options.includeMakeupNote === true) {
      columns.push({ header: 'Ghi chú điểm danh bù', key: 'makeupNote', width: 30 })
    }

    if (options.includeMarkerName !== false) {
      columns.push({ header: 'Người điểm danh', key: 'markerName', width: 20 })
    }

    return columns
  }

  /**
   * Format date to display string
   */
  private formatDate(date: Date): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  /**
   * Format date for filename (safe for filesystem)
   */
  private formatDateForFilename(date: Date): string {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }
}
