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

        const unpaidDetailLines = unpaidPayments.slice(0, 12).map((p) => {
            const period = `${String(p.month).padStart(2, '0')}/${p.year}`
            const amount = typeof p.amount === 'number' ? currency(p.amount) : 'Chưa xác định'
            const note = p.notes ? ` | Ghi chú: ${p.notes}` : ''
            return `- ${period}: ${amount}${note}`
        })

        return [
            'Thông tin học phí:',
            `Tổng số tiền đã đóng: ${currency(totalPaid)}`,
            `Tổng số tiền chưa đóng: ${currency(totalUnpaid)}${unknownUnpaidCount > 0 ? ` (còn ${unknownUnpaidCount} khoản chưa xác định số tiền)` : ''}`,
            unpaidPayments.length ? 'Chi tiết các khoản chưa đóng:' : 'Không có khoản học phí chưa đóng.',
            ...unpaidDetailLines,
            unpaidPayments.length > unpaidDetailLines.length
                ? `... và ${unpaidPayments.length - unpaidDetailLines.length} khoản chưa đóng khác.`
                : '',
        ].filter(Boolean).join('\n')
    }

    formatLatestAttendanceSummary(data: AttendanceImageTemplateData): string {
        const attendanceStatusMap: Record<string, string> = {
            PRESENT: 'Có mặt',
            LATE: 'Đi muộn',
            ABSENT: 'Vắng mặt',
        }

        const status = attendanceStatusMap[data.attendance.status] || data.attendance.status
        const homeworkText = data.homework
            ? `BTVN: Đã nộp lúc ${data.homework.submitAt}${data.homework.points ? ` | Điểm: ${data.homework.points}` : ''}`
            : 'BTVN: Chưa có bài nộp gần nhất'

        return [
            'Thông tin điểm danh gần nhất:',
            `Học sinh: ${data.student.fullName || data.student.studentId}`,
            `Lớp: ${data.classInfo.className}`,
            `Khóa học: ${data.classInfo.courseName}`,
            `Buổi học: ${data.session.sessionDate} (${data.session.startTime} - ${data.session.endTime})`,
            `Trạng thái: ${status}`,
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
                text: 'Bạn chưa đăng ký Zalo phụ huynh. Vui lòng chọn một tùy chọn bên dưới.',
                attachment: {
                    type: 'template',
                    payload: {
                        buttons: [
                            {
                                title: 'Đăng ký phụ huynh',
                                type: 'oa.query.show',
                                payload: ZaloService.REGISTER_PARENT_PAYLOAD,
                            },
                            {
                                title: 'Liên hệ hỗ trợ',
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_SUPPORT_URL || 'https://zalo.me/0333726202',
                                },
                            },
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
                            {
                                title: 'Liên hệ tư vấn',
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_SUPPORT_URL || 'https://zalo.me/0333726202',
                                },
                            },
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
                text: `Chào mừng phụ huynh học sinh em ${studentName}`,
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
                                title: 'Gỡ đăng kí số điện thoại',
                                type: 'oa.query.show',
                                payload: ZaloService.UNREGISTER_PAYLOAD,
                            },
                        ],
                    },
                },
            },
        })
    }
}
