import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceStatusLabels } from 'src/shared/enums'
import { formatVnDate, formatVnDateTime, formatVnTime } from 'src/shared/utils/vietnam-date.util'
import { ZaloService } from 'src/infrastructure/services'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

interface SendAttendanceToParentInput {
    attendanceId: number
    appId?: string
}

@Injectable()
export class SendAttendanceToParentUseCase {
    private static readonly DEFAULT_APP_ID = '443601004373365149'

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly zaloService: ZaloService,
        private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
    ) { }

    async execute(input: SendAttendanceToParentInput): Promise<boolean> {
        const appId = input.appId || process.env.ZALO_APP_ID || SendAttendanceToParentUseCase.DEFAULT_APP_ID

        const attendance = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.attendanceRepository.findById(input.attendanceId)
        })

        if (!attendance) {
            return false
        }

        const parentZaloId = attendance.student?.parentZaloId
        if (!parentZaloId) {
            return false
        }

        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            console.warn(`[Attendance->Parent] Không tìm thấy access token cho app_id=${appId}`)
            return false
        }

        const studentName = attendance.student?.user
            ? `${attendance.student.user.lastName || ''} ${attendance.student.user.firstName || ''}`.trim()
            : `#${attendance.studentId}`

        const className = attendance.classSession?.courseClass?.className || 'N/A'
        const sessionDate = attendance.classSession?.sessionDate ? formatVnDate(attendance.classSession.sessionDate) : 'N/A'
        const sessionTime = attendance.classSession?.startTime && attendance.classSession?.endTime
            ? `${formatVnTime(attendance.classSession.startTime)} - ${formatVnTime(attendance.classSession.endTime)}`
            : ''
        const arrivalTime = attendance.markedAt ? formatVnDateTime(attendance.markedAt) : 'Chưa có dữ liệu'
        const studentId = attendance.studentId ?? attendance.student?.studentId
        const homeworkId = attendance.classSession?.homeworkId

        let homeworkLine = 'BTVN: Buổi học này chưa có bài tập về nhà'
        if (typeof homeworkId === 'number' && studentId) {
            const homeworkSubmit = await this.unitOfWork.executeInTransaction(async (repos) => {
                return repos.homeworkSubmitRepository.findByHomeworkAndStudent(homeworkId, studentId)
            })

            if (homeworkSubmit) {
                const pts = homeworkSubmit.competitionSubmit?.totalPoints ?? homeworkSubmit.points
                const maxPts = homeworkSubmit.competitionSubmit?.maxPoints
                const pointsText =
                    pts === null || pts === undefined
                        ? ''
                        : homeworkSubmit.competitionSubmitId && maxPts != null
                            ? ` | Điểm: ${pts}/${maxPts}`
                            : ` | Điểm: ${pts}`

                homeworkLine = `BTVN: Đã nộp lúc ${formatVnDateTime(homeworkSubmit.submitAt)}${pointsText}`
            } else {
                homeworkLine = 'BTVN: Chưa nộp'
            }
        }

        const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status
        const makeupLine = attendance.status === 'ABSENT' && attendance.classSession?.makeupNote
            ? `Lịch học bù: ${attendance.classSession.makeupNote}`
            : ''

        const messageLines = [
            'Thông báo điểm danh:',
            `Học sinh: ${studentName}`,
            `Lớp: ${className}`,
            `Ngày học: ${sessionDate}${sessionTime ? ` (${sessionTime})` : ''}`,
            `Thời gian đến lớp: ${arrivalTime}`,
            `Trạng thái: ${statusLabel}`,
            makeupLine,
            homeworkLine,
            attendance.notes ? `Ghi chú: ${attendance.notes}` : '',
        ].filter(Boolean)

        try {
            await this.zaloService.sendMessage(accessToken, {
                recipient: { user_id: parentZaloId },
                message: {
                    text: messageLines.join('\n'),
                },
            })
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error_description ||
                error?.response?.data?.message ||
                error?.message ||
                'Unknown Zalo send error'

            console.warn('[Attendance->Parent] Gửi Zalo thất bại, bỏ qua để không ảnh hưởng luồng chính:', {
                attendanceId: attendance.attendanceId,
                studentId: attendance.studentId,
                parentZaloId,
                errorMessage,
            })

            return false
        }

        if (!attendance.parentNotified) {
            await this.unitOfWork.executeInTransaction(async (repos) => {
                await repos.attendanceRepository.update(attendance.attendanceId, {
                    parentNotified: true,
                })
            })
        }

        return true
    }
}
