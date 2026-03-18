import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { AttendanceStatusLabels } from 'src/shared/enums'
import { formatVnDate, formatVnTime } from 'src/shared/utils/vietnam-date.util'
import { ZaloService } from 'src/infrastructure/services'

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

        const tokenRecord = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.zaloTokenRepository.findByAppId(appId)
        })

        if (!tokenRecord?.accessToken) {
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

        const statusLabel = AttendanceStatusLabels[attendance.status] || attendance.status

        const messageLines = [
            'Thong bao diem danh:',
            `Hoc sinh: ${studentName}`,
            `Lop: ${className}`,
            `Ngay hoc: ${sessionDate}${sessionTime ? ` (${sessionTime})` : ''}`,
            `Trang thai: ${statusLabel}`,
            attendance.notes ? `Ghi chu: ${attendance.notes}` : '',
        ].filter(Boolean)

        await this.zaloService.sendMessage(tokenRecord.accessToken, {
            recipient: { user_id: parentZaloId },
            message: {
                text: messageLines.join('\n'),
            },
        })

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
