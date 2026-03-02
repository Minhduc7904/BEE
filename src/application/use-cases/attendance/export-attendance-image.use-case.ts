// src/application/use-cases/attendance/export-attendance-image.use-case.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IAttendanceRepository } from '../../../domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from '../../../domain/repositories/tuition-payment.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { ImageExportService } from '../../../infrastructure/services/image-export.service'
import { ExportAttendanceImageOptionsDto } from '../../dtos/attendance/export-attendance-image-options.dto'
import type { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import type { HomeworkSubmit } from '../../../domain/entities'

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
 * - Generate styled HTML card
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

        // 5. Generate HTML content
        const html = this.generateAttendanceHTML(attendance, options, tuition, homeworkSubmit)

        // 6. Export to image
        const result = await this.imageExportService.exportToImage({
            html,
            format: options.format || 'png',
            quality: options.quality || 90,
            width: options.width || 1200,
            height: 1600,
            fullPage: true,
            waitTime: 1000,
            deviceScaleFactor: 2,
        })

        // 6. Generate custom filename
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
     * Generate beautiful HTML for attendance card
     * @private
     */
    private generateAttendanceHTML(
        attendance: any,
        options: ExportAttendanceImageOptionsDto,
        tuition: TuitionPayment | null = null,
        homeworkSubmit: HomeworkSubmit | null = null,
    ): string {
        const student = attendance.student || {}
        const user = student.user || {}
        const session = attendance.classSession || {}
        const classInfo = session.courseClass || {}
        const course = classInfo.course || {}
        const teacherUser = classInfo.instructor?.user || {}
        const markerUser = attendance.marker?.user || {}
        const sessionDate = session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('vi-VN') : 'N/A'

        const markedAt = attendance.markedAt ? new Date(attendance.markedAt).toLocaleString('vi-VN') : 'N/A'
        const formatVietnamTime = (time: string | Date | any): string => {
            if (!time) return 'N/A'
            try {
                let date: Date
                if (time instanceof Date) {
                    date = time
                } else if (typeof time === 'string' && /^\d{2}:\d{2}/.test(time)) {
                    // "HH:mm" or "HH:mm:ss" string — treat as-is, no timezone shift needed
                    const [hour, minute] = time.split(':').map(Number)
                    const h = String(hour).padStart(2, '0')
                    const m = String(minute).padStart(2, '0')
                    return `${h}:${m}`
                } else {
                    date = new Date(time)
                }
                // Apply +7h offset manually
                const utcMs = date.getTime()
                const vn = new Date(utcMs + 7 * 60 * 60 * 1000)
                const h = String(vn.getUTCHours()).padStart(2, '0')
                const m = String(vn.getUTCMinutes()).padStart(2, '0')
                return `${h}:${m}`
            } catch {
                return String(time)
            }
        }
        const startTime = session.startTime ? formatVietnamTime(session.startTime) : 'N/A'
        const endTime = session.endTime ? formatVietnamTime(session.endTime) : 'N/A'

        const STATUS_MAP = {
            PRESENT: { text: 'CÓ MẶT', class: 'status-present' },
            LATE: { text: 'ĐI MUỘN', class: 'status-late' },
            ABSENT: { text: 'VẮNG', class: 'status-absent' },
        }

        const status = STATUS_MAP[attendance.status] || STATUS_MAP.PRESENT

        return `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Phiếu điểm danh</title>
<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
        }

        .card {
            width: 100%;
            margin: 0;
            background: #fff;
            overflow: hidden;
        }

        /* ===== HEADER ===== */
        .header {
            background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
            position: relative;
            border-bottom: 5px solid #1e40af;
        }

        .logo-circle {
            width: 70px;
            height: 70px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            overflow: hidden;
        }

        .logo-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .logo-text {
            color: #f59e0b;
            font-size: 24px;
            font-weight: bold;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .header .subtitle {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .header .lesson-info {
            font-size: 14px;
            margin-top: 5px;
        }

        .header .date-info {
            font-size: 12px;
            margin-top: 3px;
        }

        /* ===== CONTENT ===== */
        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
            text-transform: none;
        }

        .info-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }

        .info-item {
            font-size: 15px;
            color: #1f2937;
        }

        .info-item.full-width {
            grid-column: 1 / -1;
        }

        .status-present {
            color: #16a34a;
            font-weight: bold;
            font-size: 16px;
        }

        .status-late {
            color: #ca8a04;
            font-weight: bold;
            font-size: 16px;
        }

        .status-absent {
            color: #dc2626;
            font-weight: bold;
            font-size: 16px;
        }

        /* ===== COMMENT SECTION ===== */
        .comment-section {
            background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #cbd5e1;
            border-radius: 8px;
            padding: 0;
            margin: 30px 0;
        }

        .comment-header {
            background: #1e40af;
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
        }

        .comment-content {
            padding: 30px 20px;
        }

        .comment-subsection {
            margin-bottom: 25px;
        }

        .comment-subsection-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
        }

        .comment-text {
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
            margin-left: 20px;
        }

        .no-comment {
            font-size: 16px;
            color: #6b7280;
            margin-left: 20px;
        }

        /* ===== FOOTER ===== */
        .footer {
            padding: 40px;
            position: relative;
        }

        .signature-area {
            text-align: right;
            margin-top: 30px;
        }

        .signature-label {
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 10px;
        }

        .signature-name {
            font-size: 20px;
            font-weight: bold;
            font-style: italic;
            color: #2563eb;
            font-family: cursive, 'Brush Script MT', 'Lucida Handwriting', fantasy;
            margin-bottom: 5px;
        }

        .signature-line {
            width: 200px;
            height: 1px;
            background: #666666;
            margin: 5px 0 0 auto;
        }
    </style>
</head>

<body>
<div class="card">

    <!-- HEADER -->
    <div class="header">
        <div class="logo-circle">
            <img src="https://beeedu.vn/student/images/logo/logo1.svg"
                 onerror="this.parentElement.innerHTML='<span class=\\'logo-text\\'>TB</span>'"/>
        </div>
        <h1>TOÁN THẦY BEE</h1>
        <div class="subtitle">PHIẾU ĐIỂM DANH HỌC SINH</div>
        ${options.includeCourseName !== false ? `<div class="lesson-info">${course.courseName || 'Khoá học'} ${options.includeClassName !== false ? `– ${classInfo.className || ''}` : ''}</div>` : ''}
        <div class="date-info">Ngày học: ${sessionDate}${options.includeStartTime !== false && options.includeEndTime !== false ? ` | Giờ: ${startTime} - ${endTime}` : options.includeStartTime !== false ? ` | Giờ bắt đầu: ${startTime}` : options.includeEndTime !== false ? ` | Giờ kết thúc: ${endTime}` : ''}</div>
    </div>

    <!-- CONTENT -->
    <div class="content">

        <!-- STUDENT INFO -->
        <div class="section">
            <div class="section-title">THÔNG TIN HỌC SINH</div>
            <div class="info-row">
                <div class="info-item">Họ tên: <strong>${user.lastName || ''} ${user.firstName || ''}</strong></div>
                ${options.includeClassName !== false ? `<div class="info-item">Lớp: <strong>${classInfo.className || 'N/A'}</strong></div>` : ''}
            </div>
            ${options.includeStudentId !== false || options.includeEmail !== false
                ? `
            <div class="info-row">
                ${options.includeStudentId !== false ? `<div class="info-item">Mã học sinh: <strong>${student.studentId || 'N/A'}</strong></div>` : ''}
                ${options.includeEmail !== false && user.email ? `<div class="info-item">Email: <strong>${user.email}</strong></div>` : ''}
            </div>
            `
                : ''
            }
            ${options.includeParentPhone !== false || options.includeStudentPhone !== false
                ? `
            <div class="info-row">
                ${options.includeParentPhone !== false ? `<div class="info-item">ĐT PH: <strong>${student.parentPhone || 'N/A'}</strong></div>` : ''}
                ${options.includeStudentPhone !== false ? `<div class="info-item">ĐT HS: <strong>${student.studentPhone || 'Không có'}</strong></div>` : ''}
            </div>
            `
                : ''
            }
            ${options.includeGradeSchool !== false && (student.grade || student.school)
                ? `
            <div class="info-row">
                ${student.grade ? `<div class="info-item">Khối: <strong>${student.grade}</strong></div>` : ''}
                ${student.school ? `<div class="info-item">Trường: <strong>${student.school}</strong></div>` : ''}
            </div>
            `
                : ''
            }
        </div>

        <!-- ATTENDANCE INFO -->
        <div class="section">
            <div class="section-title">THÔNG TIN ĐIỂM DANH</div>
            <div class="info-row">
                <div class="info-item">
                    Trạng thái:
                    <span class="${status.class}">${status.text}</span>
                </div>
            </div>
            ${options.includeMarkedAt !== false
                ? `
            <div class="info-row">
                <div class="info-item full-width">
                    Thời gian đến lớp:
                    <strong style="color:#F44336;">${markedAt}</strong>
                </div>
            </div>
            `
                : ''
            }
        </div>

        <!-- TUITION INFO -->
        ${options.includeTuition !== false
                ? `
        <div class="section">
            <div class="section-title">HỌC PHÍ</div>
            <div class="info-row">
                <div class="info-item">Tháng: <strong>${options.tuitionMonth}/${options.tuitionYear}</strong></div>
            </div>
            ${tuition
                    ? `
            <div class="info-row">
                <div class="info-item">
                    Số tiền: <strong>${tuition.amount !== null && tuition.amount !== undefined ? tuition.amount.toLocaleString('vi-VN') + ' ₫' : 'Chưa xác định'}</strong>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    Trạng thái:
                    <span class="${tuition.status === 'PAID' ? 'status-present' : 'status-absent'}">${tuition.status === 'PAID' ? 'ĐÃ ĐÓNG' : 'CHƯA ĐÓNG'}</span>
                </div>
            </div>
            ${tuition.paidAt
                        ? `
            <div class="info-row">
                <div class="info-item">Ngày đóng: <strong>${new Date(tuition.paidAt).toLocaleDateString('vi-VN')}</strong></div>
            </div>
            `
                        : ''
                    }
            `
                    : `
            <div class="info-row">
                <div class="info-item" style="color:#6b7280;">Không tìm thấy thông tin học phí cho tháng ${options.tuitionMonth}/${options.tuitionYear}</div>
            </div>
            `
                }
        </div>
        `
                : ''
            }

        <!-- COMMENTS -->
        ${options.includeNotes !== false
                ? `
        <div class="comment-section">
            <div class="comment-header">NHẬN XÉT VÀ ĐÁNH GIÁ</div>
            <div class="comment-content">

                <div class="comment-subsection">
                    <div class="comment-subsection-title">1. Thông tin bài tập về nhà (BTVN):</div>
                    ${options.includeHomework === true
                    ? homeworkSubmit
                        ? `
                    <div class="info-row">
                        <div class="info-item">Thời gian nộp: <strong>${new Date(homeworkSubmit.submitAt).toLocaleString('vi-VN')}</strong></div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">Nhận xét: <span style="white-space:pre-wrap;word-break:break-word;">${(() => {
                            if (homeworkSubmit.feedback) return homeworkSubmit.feedback
                            const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
                            const maxPts = homeworkSubmit.competitionSubmit?.maxPoints
                            // console.log('Calculating feedback for points:', pts, 'out of', maxPts)
                            if (pts != null && maxPts != null && maxPts > 0) {
                                const pct = (pts / maxPts) * 100
                                if (pct < 50)
                                    return '<span style="color:#dc2626;font-weight:600;">Kết quả chưa đạt yêu cầu.</span> Con cần cố gắng hơn trong quá trình học tập. Thầy/cô mong con dành thêm thời gian ôn luyện lại kiến thức cơ bản và rèn luyện thêm các dạng bài tương tự.'

                                if (pct < 70)
                                    return '<span style="color:#ca8a04;font-weight:600;">Kết quả ở mức trung bình.</span> Con đã có sự cố gắng, tuy nhiên cần chú ý hơn đến những phần kiến thức còn chưa vững. Hãy luyện tập thêm để cải thiện kết quả nhé.'

                                if (pct < 80)
                                    return '<span style="color:#2563eb;font-weight:600;">Kết quả khá.</span> Con đã nắm được phần lớn kiến thức và hoàn thành bài tương đối tốt. Tiếp tục cố gắng, cẩn thận hơn ở những chi tiết nhỏ để đạt kết quả cao hơn.'

                                return '<span style="color:#16a34a;font-weight:600;">Kết quả tốt.</span> Con đã hoàn thành bài tập rất tốt. Thầy/cô ghi nhận sự nỗ lực của con và mong con tiếp tục phát huy trong những bài học tiếp theo.'
                            }
                            return 'Chưa có nhận xét'
                        })()}</span></div>
                    </div>
                    ${(homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points) !== null && (homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points) !== undefined
                            ? `
                    <div class="info-row">
                        <div class="info-item">
                            Điểm: 
                            <strong style="color:#16a34a;">
                            ${homeworkSubmit.competitionSubmitId && homeworkSubmit.competitionSubmit?.maxPoints != null
                                ? `${homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points ?? 0} / ${homeworkSubmit.competitionSubmit.maxPoints}`
                                : (homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points ?? 0)
                            }
                            </strong>
                        </div>
                    </div>
                    </div>`
                            : ''
                        }
                    ${homeworkSubmit.gradedAt
                            ? `
                    <div class="info-row">
                        <div class="info-item">Ngày chấm: <strong>${new Date(homeworkSubmit.gradedAt).toLocaleDateString('vi-VN')}</strong></div>
                    </div>`
                            : ''
                        }

                    `
                        : '<div class="no-comment">Học sinh chưa nộp bài tập</div>'
                    : '<div class="no-comment">Chưa có bài tập về nhà được giao</div>'
                }
                </div>

                ${session.makeupNote && attendance.status === 'ABSENT'
                    ? `
                <div class="comment-subsection">
                    <div class="comment-subsection-title">2. Thông tin buổi học bù:</div>
                    <div class="comment-text" style="color:#dc2626;font-weight:500;">${session.makeupNote}</div>
                </div>
                `
                    : ''
                }

                <div class="comment-subsection">
                    <div class="comment-subsection-title">${session.makeupNote && attendance.status === 'ABSENT' ? '3' : '2'}. Nhận xét bài tập trên lớp:</div>
                    <div class="no-comment">Chưa có nhận xét về bài tập trên lớp</div>
                </div>

                <div class="comment-subsection">
                    <div class="comment-subsection-title">${session.makeupNote && attendance.status === 'ABSENT' ? '4' : '3'}. Nhận xét chung:</div>
                    ${attendance.notes
                    ? `<div class="comment-text">${attendance.notes}</div>`
                    : `<div class="no-comment">Không có nhận xét</div>`
                }
                </div>

            </div>
        </div>
        `
                : ''
            }

    </div>

    <!-- FOOTER -->
    ${options.includeTeacherName !== false || options.includeMarkerName !== false
                ? `
    <div class="footer">
        ${options.includeTeacherName !== false
                    ? `
        <div class="signature-area">
            <div class="signature-label">Giáo viên giảng dạy</div>
            <div class="signature-name">
                ${teacherUser.lastName || ''} ${teacherUser.firstName || ''}
            </div>
            <div class="signature-line"></div>
        </div>
        `
                    : ''
                }
        ${options.includeMarkerName !== false
                    ? `
        <div class="signature-area">
            <div class="signature-label">Người điểm danh</div>
            <div class="signature-name">
                ${markerUser.lastName || ''} ${markerUser.firstName || ''}
            </div>
            <div class="signature-line"></div>
        </div>
        `
                    : ''
                }
    </div>
    `
                : ''
            }

</div>
</body>
</html>
`
    }
}
