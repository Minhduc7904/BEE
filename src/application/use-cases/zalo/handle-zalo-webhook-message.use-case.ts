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

        // 🔥 FIX QUAN TRỌNG: phân biệt userId thật
        const isOaEvent = eventName?.startsWith('oa_send_')
        const userId = isOaEvent
            ? (payload as any)?.recipient?.id // OA gửi → lấy recipient
            : payload?.sender?.id            // user gửi → lấy sender

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

        // ===== B3 - Query student (1 lần duy nhất) =====
        const student = await this.studentRepository.findByParentZaloId(userId)
        console.log(`[Zalo Webhook] Received event=${eventName} from userId=${userId}, linkedStudentId=${student?.studentId}`)
        // ===== B4 - OA → chuyển HUMAN =====
        if (isOaEvent) {
            if (!student) {
                return BaseResponseDto.success('Webhook received', {
                    handled: false,
                    reason: 'No linked student found for user',
                    event_name: eventName,
                })
            }

            await this.studentRepository.update(student.studentId, {
                conversationMode: ConversationMode.HUMAN,
                lastAdminReplyAt: new Date(),
            })

            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Switched to HUMAN mode',
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

        // ===== B7 - Chưa link → vẫn cho bot xử lý =====
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

        // ===== B8 - HUMAN / BOT logic =====
        if (student.conversationMode === ConversationMode.HUMAN) {
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

            // 🔄 Hết timeout → quay lại BOT
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
