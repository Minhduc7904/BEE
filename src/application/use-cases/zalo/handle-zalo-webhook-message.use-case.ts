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

        console.log('[Zalo Webhook] B2 - Đang lấy access token hợp lệ theo app_id')
        const accessToken = await this.getValidZaloAccessTokenUseCase.execute({ appId })

        if (!accessToken) {
            console.log('[Zalo Webhook] Dừng xử lý - Không tìm thấy access token theo app_id')
            return BaseResponseDto.success('Webhook received', {
                handled: false,
                reason: 'No access token found for app_id',
                event_name: eventName,
            })
        }

        console.log('[Zalo Webhook] B2.1 - Đã tìm thấy access token, tiếp tục xử lý nghiệp vụ')

        console.log('[Zalo Webhook] B3 - Kiểm tra user đã đăng ký parentZaloId chưa')
        const linkedParentStudent = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.studentRepository.findByParentZaloId(userId)
        })

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
