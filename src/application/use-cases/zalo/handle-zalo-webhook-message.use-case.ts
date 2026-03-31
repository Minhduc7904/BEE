import { Inject, Injectable } from '@nestjs/common'
import type { IStudentRepository } from 'src/domain/repositories'
import { HandleZaloUserSelectionUseCase } from './handle-zalo-user-selection.use-case'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { GetValidZaloAccessTokenUseCase } from './get-valid-zalo-access-token.use-case'
import { ConversationMode } from 'src/shared/enums'

interface ZaloWebhookPayload {
    app_id?: string
    event_name?: string

    sender?: {
        id?: string
        admin_id?: string
    }

    recipient?: {
        id?: string // 🔥 QUAN TRỌNG cho oa_send_*
    }

    message?: {
        text?: string
        msg_id?: string
        attachments?: any[] // 🔥 future-proof (image, gif, sticker)
    }
}

interface ZaloWebhookHandleResult {
    handled: boolean
    reason?: string
    event_name?: string
}

@Injectable()
export class HandleZaloWebhookMessageUseCase {
    constructor(
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
        private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
        private readonly handleZaloUserSelectionUseCase: HandleZaloUserSelectionUseCase,
    ) { }

    async execute(payload: ZaloWebhookPayload): Promise<BaseResponseDto<ZaloWebhookHandleResult>> {
        const eventName = payload?.event_name
        const appId = payload?.app_id
        const isAdminMessage = !!payload?.sender?.admin_id

        const isOaEvent = eventName?.startsWith('oa_send_')
        const userId = isOaEvent
            ? payload?.recipient?.id
            : payload?.sender?.id

        // ===== B1 - Validate =====
        if (!appId || !eventName) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing app_id or event_name',
            })
        }

        if (!userId) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing user id',
                event_name: eventName,
            })
        }

        // ===== B2 - Supported events =====
        const SUPPORTED_EVENTS = [
            'user_send_text',
            'user_send_sticker',
            'user_send_gif',
            'user_send_image',
            'oa_send_text',
            'oa_send_image',
            'oa_send_sticker',
            'oa_send_gif',
        ]

        if (!SUPPORTED_EVENTS.includes(eventName)) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Unsupported event',
                event_name: eventName,
            })
        }

        // ===== B3 - Query student =====
        const student = await this.studentRepository.findByParentZaloId(userId)

        console.log(`[Zalo Webhook] event=${eventName}, userId=${userId}, studentId=${student?.studentId}`)

        // ===== B4 - OA → HUMAN =====
        if (isOaEvent) {
            if (!student) {
                return BaseResponseDto.success('Webhook received', {
                    handled: false,
                    reason: 'No linked student found',
                    event_name: eventName,
                })
            }

            // 🔥 CHỈ admin mới được chuyển HUMAN
            if (isAdminMessage) {
                console.log(`[Zalo Webhook] Admin message → switch to HUMAN, isAdminMessage=${isAdminMessage}`)

                await this.studentRepository.update(student.studentId, {
                    conversationMode: ConversationMode.HUMAN,
                    lastAdminReplyAt: new Date(),
                })

                return BaseResponseDto.success('Webhook received', {
                    handled: false,
                    reason: 'Switched to HUMAN mode (admin message)',
                    event_name: eventName,
                })
            }

            // 🔥 Bot message → ignore
            console.log(`[Zalo Webhook] Ignore bot message (no admin_id), isAdminMessage=${isAdminMessage}`)

            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Ignore bot self message',
                event_name: eventName,
            })
        }

        // ===== B5 - Normalize =====
        const rawMessage = payload?.message ?? {}
        const incomingText = rawMessage?.text?.trim() || '[USER_SEND_MEDIA]'

        // 🔥 B5.1 - Detect command force BOT
        const isForceBotCommand = /^#\w+/i.test(incomingText)

        // ===== B6 - Access token =====
        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found',
                event_name: eventName,
            })
        }

        // ===== B7 - Nếu chưa link =====
        if (!student) {
            return this.handleZaloUserSelectionUseCase.execute({
                appId,
                eventName,
                userId,
                incomingText,
                accessToken,
                linkedParentStudent: null,
            })
        }
        console.log(`[Zalo Webhook] Found linked student: studentId=${student.studentId}, conversationMode=${student.conversationMode}`)
        // ===== B8 - HUMAN / BOT =====
        if (student.conversationMode === ConversationMode.HUMAN) {
            // 🔥 Ưu tiên command → ép về BOT
            if (isForceBotCommand) {
                console.log(`[Zalo Webhook] Force BOT due to command: ${incomingText}`)

                await this.studentRepository.update(student.studentId, {
                    conversationMode: ConversationMode.BOT,
                })
            } else {
                const now = Date.now()
                const lastReply = student.lastAdminReplyAt?.getTime() ?? 0
                const TEN_MINUTES = 10 * 60 * 1000

                if (now - lastReply < TEN_MINUTES) {
                    return BaseResponseDto.success('Webhook received', {
                        handled: false,
                        reason: 'HUMAN mode active',
                        event_name: eventName,
                    })
                }

                // 🔄 timeout → BOT
                await this.studentRepository.update(student.studentId, {
                    conversationMode: ConversationMode.BOT,
                })
            }
        }

        // ===== B9 - BOT xử lý =====
        return this.handleZaloUserSelectionUseCase.execute({
            appId,
            eventName,
            userId,
            incomingText,
            accessToken,
            linkedParentStudent: student,
        })
    }
}
