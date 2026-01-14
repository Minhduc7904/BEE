import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories/course.repository'
import { ExcelService, ExcelColumn } from '../../../infrastructure/services/excel.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ExportCourseStudentsAttendanceOptionsDto } from '../../dtos/course/export-course-students-attendance-options.dto'
import { CourseStudentsAttendanceQueryDto } from '../../dtos/course/course-students-attendance-query.dto'

@Injectable()
export class ExportCourseStudentsAttendanceUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        private readonly excelService: ExcelService,
    ) { }

    async execute(
        courseId: number,
        query: CourseStudentsAttendanceQueryDto,
        options: ExportCourseStudentsAttendanceOptionsDto = new ExportCourseStudentsAttendanceOptionsDto(),
    ): Promise<{
        buffer: Buffer
        filename: string
    }> {
        // 1. Check if course exists
        const course = await this.courseRepository.findById(courseId)
        if (!course) {
            throw new NotFoundException(`Không tìm thấy khóa học với ID ${courseId}`)
        }

        // 2. Get students with attendance data (no pagination for export)
        const filters = query.toFilterOptions()
        const result = await this.courseRepository.findStudentsWithAttendance(
            courseId,
            filters,
            { page: 1, limit: 999999, sortBy: 'studentId', sortOrder: 'asc' }
        )

        if (result.total === 0) {
            throw new NotFoundException('Không tìm thấy dữ liệu điểm danh học sinh cho khóa học này')
        }

        // 3. Prepare data for Excel
        const excelData = result.students.map((item, index) => {
            const { student, attendances } = item

            // Calculate statistics
            const totalSessions = attendances.length
            const presentCount = attendances.filter(a => a.status === 'PRESENT').length
            const absentCount = attendances.filter(a => a.status === 'ABSENT').length
            const lateCount = attendances.filter(a => a.status === 'LATE').length
            const makeupCount = attendances.filter(a => a.status === 'MAKEUP').length

            return {
                stt: index + 1,
                studentCode: student.studentId || '',
                lastName: student.user?.lastName || '',
                firstName: student.user?.firstName || '',
                school: student.school || '',
                parentPhone: student.parentPhone || '',
                studentPhone: student.studentPhone || '',
                grade: student.grade || '',
                email: student.user?.email || '',
                totalSessions,
                presentCount,
                absentCount,
                lateCount,
                makeupCount,
            }
        })

        // 4. Build filename
        const fromDate = this.formatDateForFilename(filters.fromDate)
        const toDate = this.formatDateForFilename(filters.toDate)
        const courseTitle = course.title.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `DiemDanh_${courseTitle}_${fromDate}_${toDate}.xlsx`

        // 5. Build columns based on options
        const columns = this.buildColumns(options)

        // 6. Export Excel
        const buffer = await this.excelService.exportToBuffer({
            sheetName: 'Điểm danh học sinh',
            columns,
            data: excelData,
        })

        return {
            buffer,
            filename,
        }
    }

    /**
     * Build columns based on export options
     */
    private buildColumns(options: ExportCourseStudentsAttendanceOptionsDto): ExcelColumn[] {
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

        // Statistics columns (always included)
        columns.push({ header: 'Tổng số buổi', key: 'totalSessions', width: 15 })
        columns.push({ header: 'Có mặt', key: 'presentCount', width: 12 })
        columns.push({ header: 'Vắng', key: 'absentCount', width: 12 })
        columns.push({ header: 'Muộn', key: 'lateCount', width: 12 })
        columns.push({ header: 'Học bù', key: 'makeupCount', width: 12 })

        return columns
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
