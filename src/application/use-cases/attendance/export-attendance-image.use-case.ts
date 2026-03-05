// src/application/use-cases/attendance/export-attendance-image.use-case.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IAttendanceRepository } from '../../../domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from '../../../domain/repositories/tuition-payment.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { ImageExportService } from '../../../infrastructure/services/image-export.service'
import { ExportAttendanceImageOptionsDto } from '../../dtos/attendance/export-attendance-image-options.dto'
import type { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import type { HomeworkSubmit } from '../../../domain/entities'
import { AttendanceImageTemplate, type AttendanceImageTemplateData } from '../../../infrastructure/templates/attendance-image.template'

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
        @Inject('IAttendanceRepository')
        private readonly attendanceRepository: IAttendanceRepository,
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
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
        // 1. Validate: includeTuition requires month & year
        if (options.includeTuition !== false && (!options.tuitionMonth || !options.tuitionYear)) {
            throw new BadRequestException(
                'Cần truyền tuitionMonth và tuitionYear để lấy thông tin học phí. Hoặc truyền includeTuition=false để bỏ qua phần học phí.',
            )
        }

        // 2. Fetch attendance with full details
        const attendance = await this.attendanceRepository.findById(attendanceId)
        if (!attendance) {
            throw new NotFoundException(`Attendance with ID ${attendanceId} not found`)
        }

        // 3. Fetch tuition if needed
        let tuition: TuitionPayment | null = null
        if (options.includeTuition !== false && options.tuitionMonth && options.tuitionYear) {
            const studentId = attendance.studentId ?? attendance.student?.studentId
            if (studentId) {
                tuition = await this.tuitionPaymentRepository.findByStudentAndPeriod(
                    studentId,
                    options.tuitionMonth,
                    options.tuitionYear,
                )
            }
        }

        // 4. Fetch homework submit if needed
        let homeworkSubmit: HomeworkSubmit | null = null
        const studentId = attendance.studentId ?? attendance.student?.studentId
        if (options.includeHomework === true && options.homeworkContentId && studentId) {
            homeworkSubmit = await this.homeworkSubmitRepository.findByHomeworkAndStudent(
                options.homeworkContentId,
                studentId,
            )
        }

        // 5. Build template data & render HTML
        const templateData = this.buildTemplateData(attendance, options, tuition, homeworkSubmit)
        const html = AttendanceImageTemplate.render(templateData)

        // 6. Export to image
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

        // 7. Generate custom filename
        const studentName = attendance.student?.getFullName() || 'Unknown'
        const sessionDate = attendance.classSession?.sessionDate
            ? new Date(attendance.classSession.sessionDate).toISOString().split('T')[0]
            : 'unknown-date'
        const filename = `attendance-${studentName.replace(/\s+/g, '-')}-${sessionDate}.${result.format}`

        return {
            buffer: result.buffer,
            filename,
        }
    }

    /**
     * Build template data from raw entities
     * Chuyển đổi các entity thành dữ liệu đã format sẵn cho template
     */
    private buildTemplateData(
        attendance: any,
        options: ExportAttendanceImageOptionsDto,
        tuition: TuitionPayment | null,
        homeworkSubmit: HomeworkSubmit | null,
    ): AttendanceImageTemplateData {
        const student = attendance.student || {}
        const user = student.user || {}
        const session = attendance.classSession || {}
        const classInfo = session.courseClass || {}
        const course = classInfo.course || {}
        const teacherUser = classInfo.instructor?.user || {}
        const markerUser = attendance.marker?.user || {}

        return {
            student: {
                fullName: `${user.lastName || ''} ${user.firstName || ''}`.trim(),
                studentId: String(student.studentId || 'N/A'),
                email: user.email || '',
                parentPhone: student.parentPhone || 'N/A',
                studentPhone: student.studentPhone || 'Không có',
                grade: String(student.grade || ''),
                school: student.school || '',
            },
            classInfo: {
                className: classInfo.className || 'N/A',
                courseName: course.courseName || 'Khóa học',
            },
            session: {
                sessionDate: session.sessionDate
                    ? new Date(session.sessionDate).toLocaleDateString('vi-VN')
                    : 'N/A',
                startTime: session.startTime ? this.formatVietnamTime(session.startTime) : 'N/A',
                endTime: session.endTime ? this.formatVietnamTime(session.endTime) : 'N/A',
                makeupNote: session.makeupNote || '',
            },
            attendance: {
                status: attendance.status || 'PRESENT',
                markedAt: options.includeMarkedAt !== false && attendance.markedAt
                    ? new Date(attendance.markedAt).toLocaleString('vi-VN')
                    : '',
                notes: attendance.notes || '',
            },
            teacher: {
                fullName: `${teacherUser.lastName || ''} ${teacherUser.firstName || ''}`.trim(),
            },
            marker: {
                fullName: `${markerUser.lastName || ''} ${markerUser.firstName || ''}`.trim(),
            },
            tuition: this.buildTuitionData(tuition, options),
            homework: this.buildHomeworkData(homeworkSubmit),
            options,
        }
    }

    /**
     * Build tuition display data
     */
    private buildTuitionData(
        tuition: TuitionPayment | null,
        options: ExportAttendanceImageOptionsDto,
    ): AttendanceImageTemplateData['tuition'] {
        if (options.includeTuition === false) return null

        if (!tuition) {
            return {
                month: options.tuitionMonth!,
                year: options.tuitionYear!,
                amount: '',
                status: '',
                statusClass: '',
                paidAt: '',
            }
        }

        return {
            month: options.tuitionMonth!,
            year: options.tuitionYear!,
            amount: tuition.amount !== null && tuition.amount !== undefined
                ? tuition.amount.toLocaleString('vi-VN') + ' ₫'
                : 'Chưa xác định',
            status: tuition.status === 'PAID' ? 'ĐÃ ĐÓNG' : 'CHƯA ĐÓNG',
            statusClass: tuition.status === 'PAID' ? 'paid-yes' : 'paid-no',
            paidAt: tuition.paidAt ? new Date(tuition.paidAt).toLocaleDateString('vi-VN') : '',
        }
    }

    /**
     * Build homework display data with auto-generated feedback
     */
    private buildHomeworkData(
        homeworkSubmit: HomeworkSubmit | null,
    ): AttendanceImageTemplateData['homework'] {
        if (!homeworkSubmit) return null

        const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
        const maxPts = homeworkSubmit.competitionSubmit?.maxPoints

        // Build points display
        let pointsStr = ''
        if (pts !== null && pts !== undefined) {
            pointsStr = homeworkSubmit.competitionSubmitId && maxPts != null
                ? `${pts} / ${maxPts}`
                : String(pts)
        }

        // Build feedback
        let feedback = 'Chưa có nhận xét'
        if (homeworkSubmit.feedback) {
            feedback = homeworkSubmit.feedback
        } else if (pts != null && maxPts != null && maxPts > 0) {
            feedback = this.generateAutoFeedback(pts, maxPts)
        }

        return {
            submitAt: new Date(homeworkSubmit.submitAt).toLocaleString('vi-VN'),
            points: pointsStr,
            gradedAt: homeworkSubmit.gradedAt
                ? new Date(homeworkSubmit.gradedAt).toLocaleDateString('vi-VN')
                : '',
            feedback,
        }
    }

    /**
     * Auto-generate feedback based on score percentage
     */
    private generateAutoFeedback(points: number, maxPoints: number): string {
        const pct = (points / maxPoints) * 100

        if (pct < 50) {
            return '<span style="color:var(--red-600);font-weight:600;">Kết quả chưa đạt yêu cầu.</span> Con cần cố gắng hơn trong quá trình học tập. Thầy/cô mong con dành thêm thời gian ôn luyện lại kiến thức cơ bản và rèn luyện thêm các dạng bài tương tự.'
        }
        if (pct < 70) {
            return '<span style="color:var(--yellow-600);font-weight:600;">Kết quả ở mức trung bình.</span> Con đã có sự cố gắng, tuy nhiên cần chú ý hơn đến những phần kiến thức còn chưa vững. Hãy luyện tập thêm để cải thiện kết quả nhé.'
        }
        if (pct < 80) {
            return '<span style="color:var(--blue-700);font-weight:600;">Kết quả khá.</span> Con đã nắm được phần lớn kiến thức và hoàn thành bài tương đối tốt. Tiếp tục cố gắng, cẩn thận hơn ở những chi tiết nhỏ để đạt kết quả cao hơn.'
        }
        return '<span style="color:var(--green-600);font-weight:600;">Kết quả tốt.</span> Con đã hoàn thành bài tập rất tốt. Thầy/cô ghi nhận sự nỗ lực của con và mong con tiếp tục phát huy trong những bài học tiếp theo.'
    }

    /**
     * Format time to Vietnam timezone (UTC+7)
     */
    private formatVietnamTime(time: string | Date | any): string {
        if (!time) return 'N/A'
        try {
            let date: Date
            if (time instanceof Date) {
                date = time
            } else if (typeof time === 'string' && /^\d{2}:\d{2}/.test(time)) {
                const [hour, minute] = time.split(':').map(Number)
                return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
            } else {
                date = new Date(time)
            }
            const utcMs = date.getTime()
            const vn = new Date(utcMs + 7 * 60 * 60 * 1000)
            return `${String(vn.getUTCHours()).padStart(2, '0')}:${String(vn.getUTCMinutes()).padStart(2, '0')}`
        } catch {
            return String(time)
        }
    }
}
