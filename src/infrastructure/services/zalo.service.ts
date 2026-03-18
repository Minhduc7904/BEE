import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'

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
            normalized.includes('go dang ky so dien thoai') ||
            normalized === '.'
        )
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
                                    url: process.env.ZALO_MENU_SUPPORT_URL || 'https://bee.edu.vn/contact',
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
                                    url: process.env.ZALO_MENU_SUPPORT_URL || 'https://bee.edu.vn/contact',
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
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_TUITION_URL || 'https://bee.edu.vn/tuition',
                                },
                            },
                            {
                                title: 'Xem điểm danh',
                                type: 'oa.open.url',
                                payload: {
                                    url: process.env.ZALO_MENU_ATTENDANCE_URL || 'https://bee.edu.vn/attendance',
                                },
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
