// src/application/use-cases/attendance/export-attendance-image.use-case.ts
import { Injectable } from '@nestjs/common'
import { ImageExportService } from 'src/application/interfaces'
import { ExportAttendanceImageOptionsDto } from '../../dtos/attendance/export-attendance-image-options.dto'
import { AttendanceImageTemplate } from '../../../infrastructure/templates/attendance-image.template'
import { formatVnDateISO } from '../../../shared/utils/vietnam-date.util'
import { GetAttendanceImageDataUseCase } from './get-attendance-image-data.use-case'

interface ExportImageResult {
    buffer: Buffer
    filename: string
}

/**
 * Export attendance as image use case
 *
 * FEATURES:
 * - Generate HTML from attendance data
 * - Export to PNG/JPEG/WebP
 * - Customizable display options
 * - Beautiful, print-ready design
 *
 * BUSINESS LOGIC:
 * - Fetch attendance with all relations
 * - Generate styled HTML card (delegated to AttendanceImageTemplate)
 * - Convert to high-quality image
 * - Return buffer for download
 */
@Injectable()
export class ExportAttendanceImageUseCase {
    constructor(
        private readonly getAttendanceImageDataUseCase: GetAttendanceImageDataUseCase,
        private readonly imageExportService: ImageExportService,
    ) { }

    /**
     * Execute export attendance to image
     *
     * @param attendanceId - Attendance ID to export
     * @param options - Export options
     * @returns Image buffer and filename
     */
    async execute(attendanceId: number, options: ExportAttendanceImageOptionsDto): Promise<ExportImageResult> {
        // 1. Query & compose template data
        const { attendance, templateData } = await this.getAttendanceImageDataUseCase.execute(attendanceId, options)

        // 2. Render HTML from shared template data
        const html = AttendanceImageTemplate.render(templateData)

        // 3. Export to image
        const result = await this.imageExportService.exportToImage({
            html,
            format: options.format || 'png',
            quality: options.quality || 90,
            width: options.width || 1200,
            height: 600,
            fullPage: true,
            waitTime: 1000,
            deviceScaleFactor: 2,
        })

        // 4. Generate custom filename
        const studentName = attendance.student?.getFullName() || 'Unknown'
        const sessionDate = attendance.classSession?.sessionDate
            ? formatVnDateISO(attendance.classSession.sessionDate)
            : 'unknown-date'
        const filename = `attendance-${studentName.replace(/\s+/g, '-')}-${sessionDate}.${result.format}`

        return {
            buffer: result.buffer,
            filename,
        }
    }
}
