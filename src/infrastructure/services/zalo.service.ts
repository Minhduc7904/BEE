import type { ZaloService as ZaloServicePort } from 'src/application/interfaces/zalo.interface'
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
        const supportNote =
            '⚠️ LƯU Ý: Nếu con đăng ký nhầm lịch học, vui lòng bấm "LIÊN HỆ HỖ TRỢ" để được trợ giảng hỗ trợ đăng ký lại.'

        if (!classStudents.length) {
            return '📭 HỌC SINH HIỆN CHƯA THAM GIA LỚP HỌC NÀO.'
        }

        const lines = classStudents.slice(0, 12).map((item, index) => {
            const courseClass = item?.courseClass
            const className =
                courseClass?.className || `LỚP #${item?.classId ?? 'N/A'}`
            const weeklySchedule =
                courseClass?.weeklySchedule || 'CHƯA CẬP NHẬT'
            const room = courseClass?.room || 'CHƯA CẬP NHẬT'
            const instructorLastName =
                courseClass?.instructor?.user?.lastName || ''
            const instructorFirstName =
                courseClass?.instructor?.user?.firstName || ''
            const instructorFullName =
                `${instructorLastName} ${instructorFirstName}`.trim() ||
                'CHƯA PHÂN CÔNG'

            return [
                `📘 ${index + 1}. ${className}`,
                `🗓️ LỊCH HỌC: ${weeklySchedule}`,
                `🏫 PHÒNG HỌC: ${room}`,
                `👨‍🏫 GIÁO VIÊN: ${instructorFullName}`,
            ].join('\n')
        })

        const moreText =
            classStudents.length > lines.length
                ? `\n📌 ... VÀ ${classStudents.length - lines.length} LỚP KHÁC`
                : ''

        return [
            '📚 DANH SÁCH LỚP HỌC',
            '━━━━━━━━━━━━━━━',
            lines.join('\n\n'),
            moreText,
            '',
            supportNote,
        ]
            .filter(Boolean)
            .join('\n')
    }

    formatTuitionSummary(payments: TuitionPayment[]): string {
        if (!payments.length) {
            return '📭 CHƯA CÓ DỮ LIỆU HỌC PHÍ.'
        }

        const paidPayments = payments.filter(
            (p) => p.status === TuitionPaymentStatus.PAID,
        )
        const unpaidPayments = payments.filter(
            (p) => p.status === TuitionPaymentStatus.UNPAID,
        )

        const totalPaid = paidPayments.reduce(
            (sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0),
            0,
        )

        const totalUnpaid = unpaidPayments.reduce(
            (sum, p) => sum + (typeof p.amount === 'number' ? p.amount : 0),
            0,
        )

        const unknownUnpaidCount = unpaidPayments.filter(
            (p) => p.amount === null || p.amount === undefined,
        ).length

        const currency = (value: number): string =>
            value.toLocaleString('vi-VN') + ' VND'

        const formatPaidDate = (value?: Date | null): string => {
            if (!value) return 'CHƯA CÓ'

            const parsed = value instanceof Date ? value : new Date(value)
            if (Number.isNaN(parsed.getTime())) return 'CHƯA CÓ'

            return parsed.toLocaleDateString('vi-VN')
        }

        const sortedPayments = [...payments].sort((a, b) => {
            const yearDiff = (b.year || 0) - (a.year || 0)
            if (yearDiff !== 0) return yearDiff
            return (b.month || 0) - (a.month || 0)
        })

        const detailLines = sortedPayments.map((p) => {
            const period = `${String(p.month).padStart(2, '0')}/${p.year}`
            const amount =
                typeof p.amount === 'number'
                    ? currency(p.amount)
                    : 'CHƯA XÁC ĐỊNH'

            const status =
                p.status === TuitionPaymentStatus.PAID
                    ? '✅ ĐÃ ĐÓNG'
                    : '❌ CHƯA ĐÓNG'

            const paidDate =
                p.status === TuitionPaymentStatus.PAID
                    ? ` | 📅 NGÀY ĐÓNG: ${formatPaidDate(p.paidAt)}`
                    : ''

            const note = p.notes ? ` | 📝 GHI CHÚ: ${p.notes}` : ''

            return `📌 ${period} | ${status} | 💰 ${amount}${paidDate}${note}`
        })

        return [
            '💰 THÔNG TIN HỌC PHÍ',
            '━━━━━━━━━━━━━━━',
            '⚠️ (CHỈ ÁP DỤNG TỪ 02/2026 DO HỆ THỐNG MỚI CÓ DỮ LIỆU ĐẦY ĐỦ)',
            '',
            `💵 TỔNG ĐÃ ĐÓNG: ${currency(totalPaid)}`,
            `💸 TỔNG CHƯA ĐÓNG: ${currency(totalUnpaid)}${
                unknownUnpaidCount > 0
                    ? ` (CÒN ${unknownUnpaidCount} KHOẢN CHƯA XÁC ĐỊNH)`
                    : ''
            }`,
            '',
            '📋 CHI TIẾT:',
            ...detailLines,
        ]
            .filter(Boolean)
            .join('\n')
    }

    formatLatestAttendanceSummary(data: AttendanceImageTemplateData): string {
        const attendanceStatusMap: Record<string, string> = {
            PRESENT: '✅ CÓ MẶT',
            LATE: '⏰ ĐI MUỘN',
            ABSENT: '❌ VẮNG MẶT',
        }

        const status =
            attendanceStatusMap[data.attendance.status] ||
            data.attendance.status

        // ✅ ƯU TIÊN: ghi chú học bù từ attendance.notes
        const makeupNote =
            data.attendance.status === 'ABSENT'
                ? data.session.makeupNote
                : ''

        const makeupLine = makeupNote
            ? `🔁 LỊCH HỌC BÙ: ${makeupNote}`
            : ''

        // ❗️Vắng thì không hiện BTVN
        let homeworkText = ''
        if (data.attendance.status !== 'ABSENT') {
            homeworkText = data.homework
                ? `📚 BTVN: Đã nộp lúc ${data.homework.submitAt}${
                    data.homework.points
                        ? ` | 🎯 ${data.homework.points}`
                        : ''
                }`
                : '📚 BTVN: Chưa có bài nộp gần nhất'
        }

        return [
            '📢 ĐIỂM DANH GẦN NHẤT',
            '━━━━━━━━━━━━━━━',
            `👨‍🎓 HỌC SINH: ${
                data.student.fullName || data.student.studentId
            }`,
            `🏫 LỚP: ${data.classInfo.className}`,
            `📅 BUỔI HỌC: ${data.session.sessionDate} (${data.session.startTime} - ${data.session.endTime})`,
            `📌 TRẠNG THÁI: ${status}`,
            makeupLine,
            data.attendance.markedAt
                ? `⏰ THỜI GIAN ĐIỂM DANH: ${data.attendance.markedAt}`
                : '',
            // ❗️NOTE thường vẫn giữ nếu không phải makeup
            data.attendance.notes
                ? `📝 GHI CHÚ: ${data.attendance.notes}`
                : '',
            homeworkText,
        ]
            .filter(Boolean)
            .join('\n')
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
