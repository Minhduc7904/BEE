import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

interface GetZaloWebhookTokenInput {
    oaId?: string
    appId?: string
    code: string
}

interface ZaloTokenData {
    oa_id: string
    app_id: string
    access_token?: string
    refresh_token?: string
    expires_in?: number
}

@Injectable()
export class GetZaloWebhookTokenUseCase {
    private static readonly DEFAULT_APP_ID = '443601004373365149'

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: GetZaloWebhookTokenInput): Promise<BaseResponseDto<ZaloTokenData>> {
        if (!input.code) {
            throw new BadRequestException('Missing required query param: code')
        }

        if (!input.oaId) {
            throw new BadRequestException('Missing required query param: oa_id')
        }

        const oaId = input.oaId
        const appId = input.appId || process.env.ZALO_APP_ID || GetZaloWebhookTokenUseCase.DEFAULT_APP_ID
        const secretKey = process.env.ZALO_OA_SECRET_KEY

        if (!secretKey) {
            throw new BadRequestException('Missing environment variable: ZALO_OA_SECRET_KEY')
        }

        const formData = new URLSearchParams()
        formData.append('code', input.code)
        formData.append('app_id', appId)
        formData.append('grant_type', 'authorization_code')

        try {
            const response = await axios.post(
                'https://oauth.zaloapp.com/v4/oa/access_token',
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        secret_key: secretKey,
                    },
                    timeout: 15_000,
                },
            )

            const tokenData = (response.data ?? {}) as {
                access_token?: string
                refresh_token?: string
                expires_in?: number | string
                token_type?: string
                scope?: string
            }

            const normalizedExpiresIn =
                typeof tokenData.expires_in === 'string'
                    ? Number.parseInt(tokenData.expires_in, 10)
                    : tokenData.expires_in

            const expiresIn = Number.isFinite(normalizedExpiresIn) && (normalizedExpiresIn ?? 0) > 0
                ? Number(normalizedExpiresIn)
                : 0

            const expiresAt =
                expiresIn > 0
                    ? new Date(Date.now() + expiresIn * 1000)
                    : null

            await this.unitOfWork.executeInTransaction(async (repos) => {
                await repos.zaloTokenRepository.upsertByOaAndApp({
                    oaId,
                    appId,
                    accessToken: tokenData.access_token ?? '',
                    refreshToken: tokenData.refresh_token ?? '',
                    expiresIn,
                    expiresAt,
                    tokenType: tokenData.token_type,
                    scope: tokenData.scope,
                })
            })

            return BaseResponseDto.success('Zalo access token created successfully', {
                oa_id: input.oaId,
                app_id: appId,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: expiresIn,
            })
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error_description ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to exchange Zalo code for token'

            throw new InternalServerErrorException(errorMessage)
        }
    }
}
