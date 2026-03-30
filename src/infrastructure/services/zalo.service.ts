import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import type { AttendanceImageTemplateData } from '../templates/attendance-image.template'
import { TuitionPaymentStatus } from 'src/shared/enums'
import type { TuitionPayment } from 'src/domain/entities'

export interface ZaloSendResponse {
    error?: number
    message?: string
    data?: {
        message_id?: string
    }
    [key: string]: any
}

@Injectable()
export class ZaloService {
    static readonly UNREGISTER_PAYLOAD = '#GO_DANG_KY_SDT'
    static readonly REGISTER_PARENT_PAYLOAD = '#DANG_KY_PHU_HUYNH'
    static readonly LATEST_ATTENDANCE_PAYLOAD = '#XEM_DIEM_DANH_GAN_NHAT'
    static readonly TUITION_SUMMARY_PAYLOAD = '#XEM_HOC_PHI'
    static readonly VIEW_SCHEDULE_PAYLOAD = '#XEM_LICH_HOC'

    private getSupportButton() {
        return {
            title: 'Liên hệ hỗ trợ',
            type: 'oa.open.url',
            payload: {
                url: process.env.ZALO_MENU_SUPPORT_URL || 'https://zalo.me/0399520768',
            },
        }
    }

    isRegisterParentIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === ZaloService.REGISTER_PARENT_PAYLOAD.toLowerCase() ||
            normalized.includes('đăng ký phụ huynh') ||
            normalized.includes('dang ky phu huynh')
        )
    }

    isUnregisterIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === ZaloService.UNREGISTER_PAYLOAD.toLowerCase() ||
            normalized.includes('gỡ đăng kí số điện thoại') ||
            normalized.includes('go dang ky so dien thoai')
        )
    }

    isLatestAttendanceIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === ZaloService.LATEST_ATTENDANCE_PAYLOAD.toLowerCase() ||
            normalized.includes('xem điểm danh gần nhất') ||
            normalized.includes('xem diem danh gan nhat')
        )
    }

    isTuitionSummaryIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === ZaloService.TUITION_SUMMARY_PAYLOAD.toLowerCase() ||
            normalized.includes('xem học phí') ||
            normalized.includes('xem hoc phi')
        )
    }

    isViewScheduleIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === ZaloService.VIEW_SCHEDULE_PAYLOAD.toLowerCase() ||
            normalized.includes('xem lịch học') ||
            normalized.includes('xem lich hoc')
        )
    }

    formatParentClassScheduleSummary(classStudents: any[]): string {
        const supportNote = 'Lưu ý: Nếu con đăng kí nhầm lịch học, hãy liên hệ hỗ trợ để trợ giảng đăng ký lại lịch cho con.'

        if (!classStudents.length) {
            return 'Học sinh hiện chưa tham gia lớp học nào.'
        }

        const lines = classStudents.slice(0, 12).map((item, index) => {
            const courseClass = item?.courseClass
            const className = courseClass?.className || `Lớp #${item?.classId ?? 'N/A'}`
            const weeklySchedule = courseClass?.weeklySchedule || 'Chưa cập nhật'
            const room = courseClass?.room || 'Chưa cập nhật'
            const instructorLastName = courseClass?.instructor?.user?.lastName || ''
            const instructorFirstName = courseClass?.instructor?.user?.firstName || ''
            const instructorFullName = `${instructorLastName} ${instructorFirstName}`.trim() || 'Chưa phân công'

            return [
                `${index + 1}. ${className}`,
                `- Lịch học: ${weeklySchedule}`,
                `- Phòng học: ${room}`,
                `- Giáo viên: ${instructorFullName}`,
            ].join('\n')
        })

        const moreText = classStudents.length > lines.length
            ? `\n... và ${classStudents.length - lines.length} lớp khác.`
            : ''

        return `Danh sách lớp học của học sinh:\n${lines.join('\n\n')}${moreText}\n\n${supportNote}`
    }

    formatTuitionSummary(payments: TuitionPayment[]): string {
        if (!payments.length) {
            return 'Chưa có dữ liệu học phí cho học sinh này.'
        }

        const paidPayments = payments.filter((p) => p.status === TuitionPaymentStatus.PAID)
        const unpaidPayments = payments.filter((p) => p.status === TuitionPaymentStatus.UNPAID)

        const totalPaid = paidPayments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0)
        const totalUnpaid = unpaidPayments.reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0)
        const unknownUnpaidCount = unpaidPayments.filter((p) => p.amount === null || p.amount === undefined).length

        const currency = (value: number): string => value.toLocaleString('vi-VN') + ' VND'
        const formatPaidDate = (value?: Date | null): string => {
            if (!value) return 'Chưa có'

            const parsed = value instanceof Date ? value : new Date(value)
            if (Number.isNaN(parsed.getTime())) return 'Chưa có'

            return parsed.toLocaleDateString('vi-VN')
        }

        const sortedPayments = [...payments].sort((a, b) => {
            const yearDiff = (b.year || 0) - (a.year || 0)
            if (yearDiff !== 0) return yearDiff
            return (b.month || 0) - (a.month || 0)
        })

        const detailLines = sortedPayments.map((p) => {
            const period = `${String(p.month).padStart(2, '0')}/${p.year}`
            const amount = typeof p.amount === 'number' ? currency(p.amount) : 'Chưa xác định'
            const status = p.status === TuitionPaymentStatus.PAID ? 'Đã đóng' : 'Chưa đóng'
            const paidDate = p.status === TuitionPaymentStatus.PAID
                ? ` | Ngày đóng: ${formatPaidDate(p.paidAt)}`
                : ''
            const note = p.notes ? ` | Ghi chú: ${p.notes}` : ''
            return `- ${period} | ${status} | Số tiền: ${amount}${paidDate}${note}`
        })

        return [
            'Thông tin học phí:',
            '(Lưu ý: Chỉ áp dụng các học phí từ tháng 2/2026 trở đi do hệ thống mới có dữ liệu đầy đủ)',
            `Tổng số tiền đã đóng: ${currency(totalPaid)}`,
            `Tổng số tiền chưa đóng: ${currency(totalUnpaid)}${unknownUnpaidCount > 0 ? ` (còn ${unknownUnpaidCount} khoản chưa xác định số tiền)` : ''}`,
            'Chi tiết các khoản học phí (đã đóng và chưa đóng):',
            ...detailLines,
        ].filter(Boolean).join('\n')
    }

    formatLatestAttendanceSummary(data: AttendanceImageTemplateData): string {
        const attendanceStatusMap: Record<string, string> = {
            PRESENT: 'Có mặt',
            LATE: 'Đi muộn',
            ABSENT: 'Vắng mặt',
        }

        const status = attendanceStatusMap[data.attendance.status] || data.attendance.status
        const makeupLine = data.attendance.status === 'ABSENT' && data.session.makeupNote
            ? `Lịch học bù: ${data.session.makeupNote}`
            : ''
        const homeworkText = data.homework
            ? `BTVN: Đã nộp lúc ${data.homework.submitAt}${data.homework.points ? ` | Điểm: ${data.homework.points}` : ''}`
            : 'BTVN: Chưa có bài nộp gần nhất'

        return [
            'Thông tin điểm danh gần nhất:',
            `Học sinh: ${data.student.fullName || data.student.studentId}`,
            `Lớp: ${data.classInfo.className}`,
            `Buổi học: ${data.session.sessionDate} (${data.session.startTime} - ${data.session.endTime})`,
            `Trạng thái: ${status}`,
            makeupLine,
            data.attendance.markedAt ? `Thời gian điểm danh: ${data.attendance.markedAt}` : '',
            data.attendance.notes ? `Ghi chú: ${data.attendance.notes}` : '',
            homeworkText,
        ].filter(Boolean).join('\n')
    }

    async sendMessage(accessToken: string, body: any): Promise<ZaloSendResponse> {
        const response = await axios.post<ZaloSendResponse>('https://openapi.zalo.me/v3.0/oa/message/cs', body, {
            headers: {
                access_token: accessToken,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        })

        const zaloResult = response.data ?? {}

        console.log('[Zalo API] Kết quả gọi API gửi tin:', {
            httpStatus: response.status,
            error: zaloResult.error,
            message: zaloResult.message,
            messageId: zaloResult?.data?.message_id,
        })

        if (typeof zaloResult.error === 'number' && zaloResult.error !== 0) {
            throw new InternalServerErrorException(
                `Zalo API từ chối gửi tin: error=${zaloResult.error}, message=${zaloResult.message || 'N/A'}`,
            )
        }

        return zaloResult
    }

    async sendRegistrationPrompt(accessToken: string, userId: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: { user_id: userId },
            message: {
                text: 'Vui lòng nhập số điện thoại của con hoặc số điện thoại phụ huynh đã đăng ký tại trung tâm để xác thực.',
            },
        })
    }

    async sendUnregisteredParentMenu(accessToken: string, userId: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: {
                user_id: userId,
            },
            message: {
                text: `Bạn chưa đăng ký Zalo phụ huynh. Vui lòng chọn một tùy chọn bên dưới.
(Lưu ý: Nếu bạn đang dùng Zalo trên máy tính, các nút có thể không hiển thị. Hãy mở tin nhắn trên điện thoại để sử dụng đầy đủ chức năng.)`,
                attachment: {
                    type: 'template',
                    payload: {
                        buttons: [
                            {
                                title: 'Đăng ký phụ huynh',
                                type: 'oa.query.show',
                                payload: ZaloService.REGISTER_PARENT_PAYLOAD,
                            },
                            this.getSupportButton(),
                        ],
                    },
                },
            },
        })
    }

    async sendMainMenu(accessToken: string, userId: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: {
                user_id: userId,
            },
            message: {
                text: 'Chào bạn. Bạn muốn xem thông tin nào?',
                attachment: {
                    type: 'template',
                    payload: {
                        buttons: [
                            {
                                title: 'Xem khóa học',
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_COURSES_URL || 'https://bee.edu.vn/courses',
                                },
                            },
                            {
                                title: 'Lịch học',
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_SCHEDULE_URL || 'https://bee.edu.vn/schedule',
                                },
                            },
                            this.getSupportButton(),
                        ],
                    },
                },
            },
        })
    }

    async sendParentMenu(accessToken: string, userId: string, studentName: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: {
                user_id: userId,
            },
            message: {
                text: [
                    `👋 CHÀO MỪNG PHỤ HUYNH`,
                    ``,
                    `Phụ huynh của học sinh: ${studentName}`,
                    ``,
                    `📢 Đây là tài khoản chỉ dùng để gửi thông báo.`,
                    `Nếu phụ huynh có thắc mắc, vui lòng bấm "Liên hệ hỗ trợ" để được giải đáp.`,
                ].join('\n'),
                attachment: {
                    type: 'template',
                    payload: {
                        buttons: [
                            {
                                title: 'Xem học phí',
                                type: 'oa.query.show',
                                payload: ZaloService.TUITION_SUMMARY_PAYLOAD,
                            },
                            {
                                title: 'Xem điểm danh gần nhất',
                                type: 'oa.query.show',
                                payload: ZaloService.LATEST_ATTENDANCE_PAYLOAD,
                            },
                            {
                                title: 'Xem lịch học',
                                type: 'oa.query.show',
                                payload: ZaloService.VIEW_SCHEDULE_PAYLOAD,
                            },
                            {
                                title: 'Gỡ đăng kí số điện thoại',
                                type: 'oa.query.show',
                                payload: ZaloService.UNREGISTER_PAYLOAD,
                            },
                            this.getSupportButton(),
                        ],
                    },
                },
            },
        })
    }
}
