import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { IAttendanceRepository } from '../../../domain/repositories/attendance.repository'
import type { ITuitionPaymentRepository } from '../../../domain/repositories/tuition-payment.repository'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories/homework-submit.repository'
import { ExportAttendanceImageOptionsDto } from '../../dtos/attendance/export-attendance-image-options.dto'
import type { TuitionPayment } from '../../../domain/entities/tuition-payment/tuition-payment.entity'
import type { HomeworkSubmit } from '../../../domain/entities'
import type { AttendanceImageTemplateData } from '../../../infrastructure/templates/attendance-image.template'
import { formatVnDate, formatVnDateTime, formatVnTime } from '../../../shared/utils/vietnam-date.util'

export interface AttendanceImageDataResult {
    attendance: any
    tuition: TuitionPayment | null
    homeworkSubmit: HomeworkSubmit | null
    templateData: AttendanceImageTemplateData
}

@Injectable()
export class GetAttendanceImageDataUseCase {
    constructor(
        @Inject('IAttendanceRepository')
        private readonly attendanceRepository: IAttendanceRepository,
        @Inject('ITuitionPaymentRepository')
        private readonly tuitionPaymentRepository: ITuitionPaymentRepository,
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    ) { }

    async execute(attendanceId: number, options: ExportAttendanceImageOptionsDto): Promise<AttendanceImageDataResult> {
        if (options.includeTuition !== false && (!options.tuitionMonth || !options.tuitionYear)) {
            throw new BadRequestException(
                'Cần truyền tuitionMonth và tuitionYear để lấy thông tin học phí. Hoặc truyền includeTuition=false để bỏ qua phần học phí.',
            )
        }

        const attendance = await this.attendanceRepository.findById(attendanceId)
        if (!attendance) {
            throw new NotFoundException(`Attendance with ID ${attendanceId} not found`)
        }

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

        let homeworkSubmit: HomeworkSubmit | null = null
        const studentId = attendance.studentId ?? attendance.student?.studentId
        if (options.includeHomework === true && options.homeworkContentId && studentId) {
            homeworkSubmit = await this.homeworkSubmitRepository.findByHomeworkAndStudent(
                options.homeworkContentId,
                studentId,
            )
        }

        const templateData = this.buildTemplateData(attendance, options, tuition, homeworkSubmit)

        return {
            attendance,
            tuition,
            homeworkSubmit,
            templateData,
        }
    }

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
                    ? formatVnDate(session.sessionDate)
                    : 'N/A',
                startTime: session.startTime ? formatVnTime(session.startTime) : 'N/A',
                endTime: session.endTime ? formatVnTime(session.endTime) : 'N/A',
                makeupNote: session.makeupNote || '',
            },
            attendance: {
                status: attendance.status || 'PRESENT',
                markedAt: options.includeMarkedAt !== false && attendance.markedAt
                    ? formatVnDateTime(attendance.markedAt)
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
            paidAt: tuition.paidAt ? formatVnDate(tuition.paidAt) : '',
        }
    }

    private buildHomeworkData(
        homeworkSubmit: HomeworkSubmit | null,
    ): AttendanceImageTemplateData['homework'] {
        if (!homeworkSubmit) return null

        const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
        const maxPts = homeworkSubmit.competitionSubmit?.maxPoints

        let pointsStr = ''
        if (pts !== null && pts !== undefined) {
            pointsStr = homeworkSubmit.competitionSubmitId && maxPts != null
                ? `${pts} / ${maxPts}`
                : String(pts)
        }

        let feedback = 'Chưa có nhận xét'
        if (homeworkSubmit.feedback) {
            feedback = homeworkSubmit.feedback
        } else if (pts != null && maxPts != null && maxPts > 0) {
            feedback = this.generateAutoFeedback(pts, maxPts)
        }

        return {
            submitAt: formatVnDateTime(homeworkSubmit.submitAt),
            points: pointsStr,
            gradedAt: homeworkSubmit.gradedAt
                ? formatVnDate(homeworkSubmit.gradedAt)
                : '',
            feedback,
        }
    }

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
}
