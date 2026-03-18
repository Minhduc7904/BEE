import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { GetZaloWebhookTokenUseCase } from '../../application/use-cases/zalo'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('zalo')
export class ZaloController {
    constructor(
        private readonly getZaloWebhookTokenUseCase: GetZaloWebhookTokenUseCase,
    ) { }

    @Get('webhook')
    @HttpCode(HttpStatus.OK)
    async getWebhook(
        @Query('oa_id') oaId: string,
        @Query('app_id') appIdQuery: string,
        @Query('code') code: string,
    ): Promise<BaseResponseDto<{
        oa_id: string
        app_id: string
        access_token?: string
        refresh_token?: string
        expires_in?: number
    }>> {
        return ExceptionHandler.execute(() =>
            this.getZaloWebhookTokenUseCase.execute({
                oaId,
                appId: appIdQuery,
                code,
            }),
        )
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    webhook(@Body() payload: unknown) {
        return {
            success: true,
            message: 'Zalo webhook received',
            data: payload,
            receivedAt: new Date().toISOString(),
        }
    }
}
