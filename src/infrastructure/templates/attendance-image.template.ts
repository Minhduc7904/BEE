// src/infrastructure/templates/attendance-image.template.ts
import type { ExportAttendanceImageOptionsDto } from '../../application/dtos/attendance/export-attendance-image-options.dto'

/**
 * Data interface cho attendance image template
 * Chứa tất cả dữ liệu đã được format sẵn để render HTML
 */
export interface AttendanceImageTemplateData {
    // Student info
    student: {
        fullName: string
        studentId: string
        email: string
        parentPhone: string
        studentPhone: string
        grade: string
        school: string
    }

    // Class & course info
    classInfo: {
        className: string
        courseName: string
    }

    // Session info
    session: {
        sessionDate: string
        startTime: string
        endTime: string
        makeupNote: string
    }

    // Attendance status
    attendance: {
        status: 'PRESENT' | 'LATE' | 'ABSENT'
        markedAt: string
        notes: string
    }

    // Teacher & marker
    teacher: {
        fullName: string
    }
    marker: {
        fullName: string
    }

    // Tuition info (null nếu không hiển thị)
    tuition: {
        month: number
        year: number
        amount: string
        status: string
        statusClass: string
        paidAt: string
    } | null

    // Homework submit info (null nếu không hiển thị)
    homework: {
        submitAt: string
        points: string
        gradedAt: string
        feedback: string
    } | null

    // Display options
    options: ExportAttendanceImageOptionsDto
}

/**
 * Template class tạo HTML phiếu điểm danh
 *
 * Concept: "Phiếu Học Tập Chính Thức" — Official academic report style.
 * Centered branding, table-based info layout, watermark background,
 * prominent status ribbon, structured comment section.
 *
 * Tách biệt hoàn toàn phần presentation (HTML/CSS) khỏi business logic.
 * Use case chỉ cần chuẩn bị data rồi gọi render().
 */
export class AttendanceImageTemplate {

    /**
     * Render HTML phiếu điểm danh từ data đã chuẩn bị
     */
    static render(data: AttendanceImageTemplateData): string {
        const { student, classInfo, session, attendance, teacher, marker, tuition, homework, options } = data

        const status = this.getStatusDisplay(attendance.status)
        const timeStr = this.buildTimeString(session, options)

        let commentIdx = 1

        return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Phiếu điểm danh</title>
<style>
${this.getStyles()}
</style>
</head>
<body>
<div class="page">

  <!-- Watermark -->
  <div class="watermark">BEE</div>

  ${this.renderHeader(classInfo, session, timeStr, options)}
  ${this.renderStatusRibbon(status)}

  <div class="content">
    ${this.renderStudentTable(student, classInfo, options)}
    ${this.renderAttendanceTable(attendance, status)}
    ${tuition !== null && options.includeTuition !== false ? this.renderTuitionSection(tuition) : ''}
    ${options.includeNotes !== false ? this.renderCommentSection(attendance, session, homework, options, commentIdx) : ''}
  </div>

  ${this.renderFooter(teacher, marker, options)}
  <div class="page-bottom"></div>
</div>
</body>
</html>`
    }

    // ==================== STATUS =====================

    private static getStatusDisplay(status: string) {
        const map: Record<string, { text: string; icon: string; bg: string; color: string; ribbon: string }> = {
            PRESENT: { text: 'CÓ MẶT', icon: '&#10004;', bg: '#ecfdf5', color: '#059669', ribbon: 'linear-gradient(135deg, #059669, #10b981)' },
            LATE: { text: 'ĐI MUỘN', icon: '&#9888;', bg: '#fffbeb', color: '#d97706', ribbon: 'linear-gradient(135deg, #d97706, #f59e0b)' },
            ABSENT: { text: 'VẮNG MẶT', icon: '&#10008;', bg: '#fef2f2', color: '#e11d48', ribbon: 'linear-gradient(135deg, #e11d48, #f43f5e)' },
        }
        return map[status] || map.PRESENT
    }

    private static buildTimeString(
        session: AttendanceImageTemplateData['session'],
        options: ExportAttendanceImageOptionsDto,
    ): string {
        if (options.includeStartTime !== false && options.includeEndTime !== false) {
            return `${session.startTime} — ${session.endTime}`
        }
        if (options.includeStartTime !== false) return `Bắt đầu: ${session.startTime}`
        if (options.includeEndTime !== false) return `Kết thúc: ${session.endTime}`
        return ''
    }

    // ==================== SECTIONS ====================

    private static renderHeader(
        classInfo: AttendanceImageTemplateData['classInfo'],
        session: AttendanceImageTemplateData['session'],
        timeStr: string,
        options: ExportAttendanceImageOptionsDto,
    ): string {
        const metaParts: string[] = []
        if (options.includeCourseName !== false) metaParts.push(classInfo.courseName)
        if (options.includeClassName !== false) metaParts.push(classInfo.className)
        metaParts.push(session.sessionDate)
        if (timeStr) metaParts.push(timeStr)

        return `
  <div class="header">
    <div class="header-top-line"></div>
    <div class="header-body">
      <div class="logo-area">
        <img class="logo-img" src="https://beeedu.vn/student/images/logo/logo.svg"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <div class="logo-fallback" style="display:none">BEE</div>
      </div>
      <div class="brand">TOÁN THẦY BEE</div>
      <div class="ornament">
        <span class="orn-line"></span>
        <span class="orn-diamond">&#9830;</span>
        <span class="orn-line"></span>
      </div>
      <div class="doc-title">PHIẾU ĐIỂM DANH HỌC SINH</div>
      <div class="header-meta">${metaParts.join('&ensp;|&ensp;')}</div>
    </div>
  </div>`
    }

    private static renderStatusRibbon(
        status: ReturnType<typeof this.getStatusDisplay>,
    ): string {
        return `
  <div class="ribbon" style="background:${status.ribbon}">
    <span class="ribbon-icon">${status.icon}</span>
    <span class="ribbon-text">${status.text}</span>
  </div>`
    }

    private static renderStudentTable(
        student: AttendanceImageTemplateData['student'],
        classInfo: AttendanceImageTemplateData['classInfo'],
        options: ExportAttendanceImageOptionsDto,
    ): string {
        const rows: string[] = []

        rows.push(this.tableRow('Họ và tên', student.fullName, true))
        if (options.includeClassName !== false) rows.push(this.tableRow('Lớp', classInfo.className))
        if (options.includeStudentId !== false) rows.push(this.tableRow('Mã học sinh', student.studentId))
        if (options.includeEmail !== false && student.email) rows.push(this.tableRow('Email', student.email))
        if (options.includeParentPhone !== false) rows.push(this.tableRow('SĐT phụ huynh', student.parentPhone))
        if (options.includeStudentPhone !== false) rows.push(this.tableRow('SĐT học sinh', student.studentPhone))
        if (options.includeGradeSchool !== false && student.grade) rows.push(this.tableRow('Khối', student.grade))
        if (options.includeGradeSchool !== false && student.school) rows.push(this.tableRow('Trường', student.school))

        return `
    <div class="section">
      <div class="section-label">
        <span class="section-num">I</span>
        <span>THÔNG TIN HỌC SINH</span>
      </div>
      <table class="data-table">
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`
    }

    private static renderAttendanceTable(
        attendance: AttendanceImageTemplateData['attendance'],
        status: ReturnType<typeof this.getStatusDisplay>,
    ): string {
        const rows: string[] = []
        rows.push(`<tr><td class="td-label">Trạng thái</td><td class="td-value"><span class="status-tag" style="background:${status.bg};color:${status.color};border:1px solid ${status.color}">${status.icon} ${status.text}</span></td></tr>`)
        if (attendance.markedAt) {
            rows.push(this.tableRow('Thời gian đến lớp', attendance.markedAt))
        }

        return `
    <div class="section">
      <div class="section-label">
        <span class="section-num">II</span>
        <span>ĐIỂM DANH</span>
      </div>
      <table class="data-table">
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`
    }

    private static renderTuitionSection(
        tuition: NonNullable<AttendanceImageTemplateData['tuition']>,
    ): string {
        if (!tuition.amount) {
            return `
    <div class="section">
      <div class="section-label">
        <span class="section-num">III</span>
        <span>HỌC PHÍ — THÁNG ${tuition.month}/${tuition.year}</span>
      </div>
      <div class="empty-box">Không tìm thấy thông tin học phí cho tháng ${tuition.month}/${tuition.year}</div>
    </div>`
        }

        return `
    <div class="section">
      <div class="section-label">
        <span class="section-num">III</span>
        <span>HỌC PHÍ — THÁNG ${tuition.month}/${tuition.year}</span>
      </div>
      <div class="tuition-grid">
        <div class="tuition-item">
          <div class="tuition-amount">${tuition.amount}</div>
          <div class="tuition-sub">Số tiền</div>
        </div>
        <div class="tuition-item">
          <div><span class="paid-tag ${tuition.statusClass}">${tuition.status}</span></div>
          <div class="tuition-sub">Trạng thái</div>
        </div>
        <div class="tuition-item">
          <div class="tuition-date">${tuition.paidAt || '—'}</div>
          <div class="tuition-sub">Ngày đóng</div>
        </div>
      </div>
    </div>`
    }

    private static renderCommentSection(
        attendance: AttendanceImageTemplateData['attendance'],
        session: AttendanceImageTemplateData['session'],
        homework: AttendanceImageTemplateData['homework'],
        options: ExportAttendanceImageOptionsDto,
        startIdx: number,
    ): string {
        let idx = startIdx
        const sectionNum = options.includeTuition !== false ? 'IV' : 'III'

        const blocks: string[] = []

        // 1. Homework
        blocks.push(this.commentBlock(
            idx++,
            'Bài tập về nhà (BTVN)',
            options.includeHomework === true
                ? homework
                    ? this.renderHomeworkContent(homework)
                    : '<span class="hw-missing">&#10008;&ensp;Học sinh chưa nộp bài tập</span>'
                : '<span class="muted">Chưa có bài tập về nhà được giao</span>',
        ))

        // 2. Makeup (only for ABSENT)
        if (session.makeupNote && attendance.status === 'ABSENT') {
            blocks.push(this.commentBlock(
                idx++,
                'Thông tin buổi học bù',
                `<span style="color:#e11d48;font-weight:600">${session.makeupNote}</span>`,
            ))
        }

        // 3. In-class
        blocks.push(this.commentBlock(
            idx++,
            'Nhận xét bài tập trên lớp',
            '<span class="muted">Chưa có nhận xét về bài tập trên lớp</span>',
        ))

        // 4. General
        blocks.push(this.commentBlock(
            idx++,
            'Nhận xét chung',
            attendance.notes || '<span class="muted">Không có nhận xét</span>',
        ))

        return `
    <div class="section">
      <div class="section-label">
        <span class="section-num">${sectionNum}</span>
        <span>NHẬN XÉT VÀ ĐÁNH GIÁ</span>
      </div>
      <div class="review-box">
        ${blocks.join('')}
      </div>
    </div>`
    }

    private static renderHomeworkContent(homework: NonNullable<AttendanceImageTemplateData['homework']>): string {
        const meta: string[] = []
        meta.push(`<span class="hw-tag">Nộp: ${homework.submitAt}</span>`)
        if (homework.points) meta.push(`<span class="hw-tag hw-score">Điểm: ${homework.points}</span>`)
        if (homework.gradedAt) meta.push(`<span class="hw-tag">Chấm: ${homework.gradedAt}</span>`)

        return `
          <div class="hw-meta">${meta.join('')}</div>
          ${homework.feedback ? `<div class="hw-feedback">${homework.feedback}</div>` : ''}`
    }

    private static renderFooter(
        teacher: AttendanceImageTemplateData['teacher'],
        marker: AttendanceImageTemplateData['marker'],
        options: ExportAttendanceImageOptionsDto,
    ): string {
        if (options.includeTeacherName === false && options.includeMarkerName === false) return ''

        return `
  <div class="footer">
    <div class="footer-inner">
      ${options.includeTeacherName !== false ? `
      <div class="sig">
        <div class="sig-label">Giáo viên giảng dạy</div>
        <div class="sig-name">${teacher.fullName}</div>
        <div class="sig-dotted"></div>
      </div>` : ''}
      ${options.includeMarkerName !== false ? `
      <div class="sig">
        <div class="sig-label">Người điểm danh</div>
        <div class="sig-name">${marker.fullName}</div>
        <div class="sig-dotted"></div>
      </div>` : ''}
    </div>
    <div class="footer-brand">TOÁN THẦY BEE &mdash; beeedu.vn</div>
  </div>`
    }

    // ==================== HELPERS ====================

    private static tableRow(label: string, value: string, highlight = false): string {
        return `<tr${highlight ? ' class="row-highlight"' : ''}>` +
            `<td class="td-label">${label}</td>` +
            `<td class="td-value">${value}</td></tr>`
    }

    private static commentBlock(num: number, title: string, body: string): string {
        return `
        <div class="cb">
          <div class="cb-head">
            <span class="cb-num">${num}</span>
            <span class="cb-title">${title}</span>
          </div>
          <div class="cb-body">${body}</div>
        </div>`
    }

    // ==================== STYLES ====================

    private static getStyles(): string {
        return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --navy: #0f172a;
  --navy-light: #1e293b;
  --blue: #1e40af;
  --blue-mid: #2563eb;
  --blue-light: #dbeafe;
  --blue-50: #eff6ff;
  --gold: #d4a017;
  --gold-light: #f5d670;
  --gold-bg: #fefce8;
  --gray-900: #0f172a;
  --gray-700: #334155;
  --gray-500: #64748b;
  --gray-400: #94a3b8;
  --gray-200: #e2e8f0;
  --gray-100: #f1f5f9;
  --gray-50: #f8fafc;
  --green: #059669;
  --green-bg: #ecfdf5;
  --red: #e11d48;
  --red-bg: #fff1f2;
  --amber: #d97706;
  --white: #ffffff;
  --radius: 6px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--white);
  color: var(--gray-900);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ===================== PAGE ===================== */
.page {
  position: relative;
  width: 100%;
  background: var(--white);
  overflow: hidden;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 220px;
  font-weight: 900;
  color: rgba(30, 64, 175, 0.03);
  letter-spacing: 20px;
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
}

/* ===================== HEADER ===================== */
.header {
  position: relative;
  z-index: 1;
  background: var(--white);
  padding: 0 0 28px;
  text-align: center;
}

.header-top-line {
  height: 6px;
  background: linear-gradient(90deg, var(--navy) 0%, var(--blue) 35%, var(--gold) 50%, var(--blue) 65%, var(--navy) 100%);
}

.header-body {
  padding: 32px 48px 0;
}

.logo-area {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 2px solid var(--gold);
  border-radius: 50%;
  background: var(--white);
  margin-bottom: 12px;
  box-shadow: 0 0 0 5px rgba(212, 160, 23, 0.1), 0 4px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}
.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}
.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: var(--gold);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
}

.brand {
  font-size: 26px;
  font-weight: 900;
  color: var(--navy);
  letter-spacing: 4px;
  margin-bottom: 8px;
}

.ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}
.orn-line {
  display: inline-block;
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.orn-diamond {
  color: var(--gold);
  font-size: 12px;
}

.doc-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 3px;
  margin-bottom: 10px;
}

.header-meta {
  font-size: 13px;
  color: var(--gray-500);
  font-weight: 500;
}

/* ===================== STATUS RIBBON ===================== */
.ribbon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 32px;
  color: var(--white);
}
.ribbon-icon {
  font-size: 22px;
}
.ribbon-text {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 4px;
  text-transform: uppercase;
}

/* ===================== CONTENT ===================== */
.content {
  position: relative;
  z-index: 1;
  padding: 32px 48px 16px;
}

/* ===================== SECTION ===================== */
.section {
  margin-bottom: 28px;
}
.section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--navy);
  font-size: 13px;
  font-weight: 800;
  color: var(--navy);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--navy);
  color: var(--gold-light);
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

/* ===================== DATA TABLE ===================== */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}
.data-table tr:not(:last-child) td {
  border-bottom: 1px solid var(--gray-200);
}
.data-table tr:nth-child(even) {
  background: var(--gray-50);
}
.row-highlight td {
  background: var(--blue-50) !important;
}

.td-label {
  width: 180px;
  padding: 11px 18px;
  font-size: 12px;
  font-weight: 700;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  vertical-align: middle;
  border-right: 1px solid var(--gray-200);
}
.td-value {
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  vertical-align: middle;
  word-break: break-word;
}

.status-tag {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* ===================== TUITION ===================== */
.tuition-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}
.tuition-item {
  padding: 18px 16px;
  text-align: center;
  border-right: 1px solid var(--gray-200);
}
.tuition-item:last-child {
  border-right: none;
}
.tuition-item:nth-child(even) {
  background: var(--gray-50);
}

.tuition-amount {
  font-size: 20px;
  font-weight: 800;
  color: var(--navy);
  margin-bottom: 2px;
}

.tuition-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-700);
}

.tuition-sub {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-400);
  margin-top: 4px;
}

.paid-tag {
  display: inline-block;
  padding: 4px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}
.paid-yes { background: var(--green-bg); color: var(--green); }
.paid-no  { background: var(--red-bg); color: var(--red); }

.empty-box {
  padding: 20px;
  text-align: center;
  color: var(--gray-500);
  font-size: 14px;
  border: 1px dashed var(--gray-200);
  border-radius: var(--radius);
  font-style: italic;
}

/* ===================== REVIEW BOX ===================== */
.review-box {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}

.cb {
  border-bottom: 1px solid var(--gray-200);
}
.cb:last-child {
  border-bottom: none;
}

.cb-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}
.cb-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--blue);
  color: var(--white);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.cb-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cb-body {
  padding: 14px 18px 14px 50px;
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.7;
}

.muted {
  color: var(--gray-400);
  font-style: italic;
}

.hw-missing {
  display: inline-block;
  font-size: 16px;
  font-weight: 800;
  color: var(--red);
  letter-spacing: 0.3px;
}

/* Homework meta */
.hw-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.hw-tag {
  display: inline-block;
  padding: 3px 12px;
  background: var(--gray-100);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-700);
}
.hw-score {
  background: var(--gold-bg);
  color: var(--gold);
  font-weight: 700;
}
.hw-feedback {
  padding: 10px 14px;
  background: var(--gray-50);
  border-left: 3px solid var(--gold);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 13px;
  color: var(--gray-700);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ===================== FOOTER ===================== */
.footer {
  position: relative;
  z-index: 1;
  padding: 0 48px 24px;
}

.footer-inner {
  display: flex;
  justify-content: space-around;
  gap: 40px;
  padding: 28px 0;
  border-top: 1px solid var(--gray-200);
}

.sig {
  text-align: center;
  min-width: 180px;
}
.sig-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--gray-400);
  margin-bottom: 8px;
}
.sig-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 6px;
}
.sig-dotted {
  width: 160px;
  margin: 0 auto;
  border-bottom: 1px dashed var(--gray-400);
}

.footer-brand {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-400);
  letter-spacing: 2px;
  text-transform: uppercase;
  padding-top: 16px;
  border-top: 1px solid var(--gray-200);
}

/* ===================== BOTTOM ===================== */
.page-bottom {
  height: 6px;
  background: linear-gradient(90deg, var(--navy) 0%, var(--blue) 35%, var(--gold) 50%, var(--blue) 65%, var(--navy) 100%);
}`
    }
}
