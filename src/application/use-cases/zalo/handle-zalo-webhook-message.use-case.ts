import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

interface ZaloWebhookPayload {
    app_id?: string
    event_name?: string
    sender?: {
        id?: string
    }
    message?: {
        text?: string
        msg_id?: string
    }
}

interface ZaloWebhookHandleResult {
    handled: boolean
    reason?: string
    event_name?: string
}

interface ZaloSendResponse {
    error?: number
    message?: string
    data?: {
        message_id?: string
    }
    [key: string]: any
}

@Injectable()
export class HandleZaloWebhookMessageUseCase {
    private static readonly UNREGISTER_PAYLOAD = '#GO_DANG_KY_SDT'

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    private normalizePhone(input: string): string {
        return input.replace(/[^0-9]/g, '')
    }

    private isPhoneLike(input: string): boolean {
        const normalized = this.normalizePhone(input)
        return /^0\d{9,10}$/.test(normalized)
    }

    private isUnregisterIntent(input: string): boolean {
        const normalized = input.trim().toLowerCase()
        return (
            normalized === HandleZaloWebhookMessageUseCase.UNREGISTER_PAYLOAD.toLowerCase() ||
            normalized.includes('gỡ đăng kí số điện thoại') ||
            normalized.includes('go dang ky so dien thoai') ||
            normalized === '.'
        )
    }

    private async sendMessage(accessToken: string, body: any): Promise<ZaloSendResponse> {
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

    private async sendRegistrationPrompt(accessToken: string, userId: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: { user_id: userId },
            message: {
                text: 'Vui lòng nhập số điện thoại của con hoặc số điện thoại phụ huynh đã đăng ký tại trung tâm để xác thực.',
            },
        })
    }

    private async sendMainMenu(accessToken: string, userId: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: {
                user_id: userId,
            },
            message: {
                text: 'Chào bạn. Bạn muốn xem thông tin nào?',
            },
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'button',
                    text: 'Vui lòng chọn một tùy chọn bên dưới:',
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
        })
    }

    private async sendParentMenu(accessToken: string, userId: string, studentName: string): Promise<void> {
        await this.sendMessage(accessToken, {
            recipient: {
                user_id: userId,
            },
            message: {
                text: `Chào mừng phụ huynh học sinh em ${studentName}`,
            },
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'button',
                    text: 'Vui lòng chọn một tùy chọn bên dưới:',
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
                            payload: HandleZaloWebhookMessageUseCase.UNREGISTER_PAYLOAD,
                        },
                    ],
                },
            },
        })
    }

    async execute(payload: ZaloWebhookPayload): Promise<BaseResponseDto<ZaloWebhookHandleResult>> {
        const eventName = payload?.event_name
        const appId = payload?.app_id
        const userId = payload?.sender?.id
        const incomingText = payload?.message?.text?.trim() ?? ''
        console.log('[Zalo Webhook] B1 - Đã nhận webhook từ Zalo')
        console.log('[Zalo Webhook] B1.1 - Thông tin đầu vào:', {
            eventName,
            appId,
            userId,
            incomingText,
        })
        if (!appId || !eventName) {
            console.log('[Zalo Webhook] Dừng xử lý - Thiếu app_id hoặc event_name')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing app_id or event_name',
            })
        }

        if (!userId) {
            console.log('[Zalo Webhook] Dừng xử lý - Thiếu sender.id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing sender id',
                event_name: eventName,
            })
        }

        if (eventName !== 'user_send_text') {
            console.log(`[Zalo Webhook] Bỏ qua event không hỗ trợ: ${eventName}`)
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Event is not user_send_text',
                event_name: eventName,
            })
        }

        console.log('[Zalo Webhook] B2 - Đang lấy access token theo app_id trong DB')
        const tokenRecord = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.zaloTokenRepository.findByAppId(appId)
        })

        if (!tokenRecord?.accessToken) {
            console.log('[Zalo Webhook] Dừng xử lý - Không tìm thấy access token theo app_id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found for app_id',
                event_name: eventName,
            })
        }

        console.log('[Zalo Webhook] B2.1 - Đã tìm thấy access token, tiếp tục xử lý nghiệp vụ')

        try {
            console.log('[Zalo Webhook] B3 - Kiểm tra user đã liên kết parentZaloId/studentZaloId chưa')
            const linkage = await this.unitOfWork.executeInTransaction(async (repos) => {
                const byParent = await repos.studentRepository.findByParentZaloId(userId)
                const byStudent = byParent ? null : await repos.studentRepository.findByStudentZaloId(userId)
                return { byParent, byStudent }
            })

            const linkedStudent = linkage.byParent || linkage.byStudent

            if (!linkedStudent) {
                console.log('[Zalo Webhook] B3.1 - User chưa liên kết với học sinh nào')

                if (this.isPhoneLike(incomingText)) {
                    const phone = this.normalizePhone(incomingText)
                    console.log(`[Zalo Webhook] B5 - Nhận số điện thoại: ${phone}. Đang tìm học sinh trong DB`)

                    const matchedStudent = await this.unitOfWork.executeInTransaction(async (repos) => {
                        return repos.studentRepository.findByStudentOrParentPhone(phone)
                    })

                    if (!matchedStudent) {
                        console.log('[Zalo Webhook] B5.1 - Không tìm thấy học sinh theo số điện thoại cung cấp')
                        await this.sendMessage(tokenRecord.accessToken, {
                            recipient: { user_id: userId },
                            message: {
                                text: 'Không tìm thấy học sinh theo số điện thoại này. Vui lòng kiểm tra lại hoặc liên hệ trung tâm để được hỗ trợ.',
                            },
                        })

                        return BaseResponseDto.success('Không tìm thấy học sinh theo số điện thoại', {
                            handled: true,
                            event_name: eventName,
                        })
                    }

                    console.log(`[Zalo Webhook] B6 - Tìm thấy học sinh #${matchedStudent.studentId}, cập nhật parentZaloId`)
                    await this.unitOfWork.executeInTransaction(async (repos) => {
                        await repos.studentRepository.update(matchedStudent.studentId, {
                            parentZaloId: userId,
                        })
                    })

                    console.log('[Zalo Webhook] B6.1 - Cập nhật parentZaloId thành công')

                    await this.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Đăng ký nhận thông tin phụ huynh thành công. Từ bây giờ bạn sẽ nhận được thông báo học tập của học sinh.',
                        },
                    })

                    console.log('[Zalo Webhook] B7 - Đã gửi thông báo đăng ký thành công cho phụ huynh')

                    await this.sendMainMenu(tokenRecord.accessToken, userId)

                    console.log('[Zalo Webhook] B7.1 - Đã gửi menu chính sau khi đăng ký thành công')

                    return BaseResponseDto.success('Đã liên kết Zalo phụ huynh thành công', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                console.log('[Zalo Webhook] B4 - User chưa liên kết và tin nhắn không phải số điện thoại, gửi yêu cầu nhập số điện thoại để đăng ký')
                await this.sendRegistrationPrompt(tokenRecord.accessToken, userId)

                return BaseResponseDto.success('Đã yêu cầu nhập số điện thoại để đăng ký liên kết', {
                    handled: true,
                    event_name: eventName,
                })
            }

            if (linkage.byParent) {
                const studentName = `${linkage.byParent.user?.lastName || ''} ${linkage.byParent.user?.firstName || ''}`.trim() || `#${linkage.byParent.studentId}`

                if (this.isUnregisterIntent(incomingText)) {
                    console.log(`[Zalo Webhook] B3.2a - Phụ huynh yêu cầu gỡ đăng kí số điện thoại cho học sinh #${linkage.byParent.studentId}`)

                    await this.unitOfWork.executeInTransaction(async (repos) => {
                        await repos.studentRepository.unlinkParentZaloId(linkage.byParent!.studentId)
                    })

                    await this.sendMessage(tokenRecord.accessToken, {
                        recipient: { user_id: userId },
                        message: {
                            text: 'Đã gỡ đăng kí số điện thoại thành công. Nếu cần đăng ký lại, vui lòng nhập số điện thoại học sinh hoặc phụ huynh đã đăng ký tại trung tâm.',
                        },
                    })

                    console.log('[Zalo Webhook] B3.2b - Gỡ đăng kí số điện thoại thành công')

                    return BaseResponseDto.success('Đã gỡ đăng kí số điện thoại thành công', {
                        handled: true,
                        event_name: eventName,
                    })
                }

                console.log(`[Zalo Webhook] B3.2 - User là phụ huynh học sinh #${linkage.byParent.studentId}, gửi menu phụ huynh`)
                await this.sendParentMenu(tokenRecord.accessToken, userId, studentName)
                console.log('[Zalo Webhook] B8 - Gửi menu phụ huynh thành công')

                return BaseResponseDto.success('Zalo webhook handled successfully', {
                    handled: true,
                    event_name: eventName,
                })
            }

            console.log(`[Zalo Webhook] B3.2 - User đã liên kết học sinh #${linkedStudent.studentId}, gửi menu chính`)
            await this.sendMainMenu(tokenRecord.accessToken, userId)
            console.log('[Zalo Webhook] B8 - Gửi menu chính thành công')
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error_description ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to send message to Zalo user'

            console.error('[Zalo Webhook] Lỗi trong quá trình xử lý:', {
                errorMessage,
                eventName,
                appId,
                userId,
            })

            throw new InternalServerErrorException(errorMessage)
        }

        console.log('[Zalo Webhook] Hoàn tất xử lý webhook thành công')
        return BaseResponseDto.success('Zalo webhook handled successfully', {
            handled: true,
            event_name: eventName,
        })
    }
}
