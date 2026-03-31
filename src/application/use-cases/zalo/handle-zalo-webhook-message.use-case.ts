import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { HandleZaloUserSelectionUseCase } from './handle-zalo-user-selection.use-case'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { GetValidZaloAccessTokenUseCase } from './get-valid-zalo-access-token.use-case'

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
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly getValidZaloAccessTokenUseCase: GetValidZaloAccessTokenUseCase,
        private readonly handleZaloUserSelectionUseCase: HandleZaloUserSelectionUseCase,
    ) { }

    async execute(payload: ZaloWebhookPayload): Promise<BaseResponseDto<ZaloWebhookHandleResult>> {
        // console.log('[Zalo Webhook] B1 - Đã nhận webhook từ Zalo')

        const eventName = payload?.event_name
        const appId = payload?.app_id
        const userId = payload?.sender?.id

        // ===== B1.1 - Validate =====
        if (!appId || !eventName) {
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing app_id or event_name',
            })
        }

        if (!userId) {
            // console.log('[Zalo Webhook] Dừng xử lý - Thiếu sender.id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Missing sender id',
                event_name: eventName,
            })
        }

        // ===== B2 - Support tất cả message user =====
        const SUPPORTED_EVENTS = [
            'user_send_text',
            'user_send_sticker',
            'user_send_gif',
            'user_send_image',
        ]

        if (!SUPPORTED_EVENTS.includes(eventName)) {
            // console.log(`[Zalo Webhook] Bỏ qua event không hỗ trợ: ${eventName}`)
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'Unsupported event',
                event_name: eventName,
            })
        }

        // ===== B3 - Normalize message (QUAN TRỌNG) =====
        const rawMessage = payload?.message ?? {}

        let incomingText = ''

        // Nếu có text thì ưu tiên dùng text
        if (rawMessage?.text?.trim()) {
            incomingText = rawMessage.text.trim()
        } else {
            // fallback cho sticker/gif/image
            incomingText = '[USER_SEND_MEDIA]'
        }

        // console.log('[Zalo Webhook] B3.1 - Normalize message:', {
        //     eventName,
        //     appId,
        //     userId,
        //     incomingText,
        // })

        // ===== B4 - Lấy access token =====
        // console.log('[Zalo Webhook] B4 - Đang lấy access token hợp lệ theo app_id')

        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            console.log('[Zalo Webhook] Dừng xử lý - Không tìm thấy access token theo app_id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found for app_id',
                event_name: eventName,
            })
        }

        // console.log('[Zalo Webhook] B4.1 - Đã có access token')

        // ===== B5 - Kiểm tra user liên kết =====
        // console.log('[Zalo Webhook] B5 - Kiểm tra user đã đăng ký parentZaloId chưa')

        const linkedParentStudent = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.studentRepository.findByParentZaloId(userId)
        })

        // ===== B6 - Xử lý nghiệp vụ (UNIFIED FLOW) =====
        // console.log('[Zalo Webhook] B6 - Forward xuống use case')

        return this.handleZaloUserSelectionUseCase.execute({
            appId,
            eventName,
            userId,
            incomingText,
            accessToken,
            linkedParentStudent,
        })
    }
}
