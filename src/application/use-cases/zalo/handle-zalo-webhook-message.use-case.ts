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
        const userId = payload?.sender?.id

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
                reason: 'Missing sender id',
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

        // ===== B3 - Lấy student (chỉ query 1 lần) =====
        const student = await this.studentRepository.findByParentZaloId(userId)

        // ===== B4 - Nếu admin nhắn (OA) → chuyển HUMAN =====
        console.log(`[Zalo Webhook] Received event=${eventName} from user_id=${userId}, linked_student_id=${student?.studentId}`)
        if (eventName.startsWith('oa_send_')) {
            console.log(`[Zalo Webhook] OA message received, switching to HUMAN mode if linked student exists`)
            if (!student) {
                return BaseResponseDto.success('Webhook received', {
                    handled: false,
                    reason: 'No linked student found for sender id',
                    event_name: eventName,
                })
            }

            await this.studentRepository.update(student.studentId, {
                conversationMode: ConversationMode.HUMAN,
                lastAdminReplyAt: new Date(),
            })

            console.log(`[Zalo Webhook] Switched to HUMAN mode for student_id=${student.studentId} due to OA message`)

            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Switched to HUMAN mode due to OA message',
                event_name: eventName,
            })
        }

        // ===== B5 - Normalize message =====
        const rawMessage = payload?.message ?? {}
        const incomingText = rawMessage?.text?.trim() || '[USER_SEND_MEDIA]'

        // ===== B6 - Lấy access token =====
        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found for app_id',
                event_name: eventName,
            })
        }

        // ===== B7 - Nếu chưa liên kết → vẫn cho bot xử lý (tuỳ business)
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

        // ===== B8 - Xử lý HUMAN / BOT mode =====
        if (student.conversationMode === ConversationMode.HUMAN) {
            const now = new Date()
            const lastReply = student.lastAdminReplyAt

            const TEN_MINUTES = 10 * 60 * 1000

            if (lastReply && now.getTime() - new Date(lastReply).getTime() < TEN_MINUTES) {
                // ⛔ Vẫn trong HUMAN → bot không trả lời
                return BaseResponseDto.success('Webhook received', {
                    handled: false,
                    reason: 'Conversation is in HUMAN mode (within 10 minutes)',
                    event_name: eventName,
                })
            }

            // 🔄 Hết 10 phút → chuyển lại BOT
            await this.studentRepository.update(student.studentId, {
                conversationMode: ConversationMode.BOT,
            })
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
