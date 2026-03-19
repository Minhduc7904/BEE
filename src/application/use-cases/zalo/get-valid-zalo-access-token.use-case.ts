import { Inject, Injectable } from '@nestjs/common'
import axios from 'axios'
import type { IUnitOfWork } from 'src/domain/repositories'

interface GetValidZaloAccessTokenInput {
    appId: string
}

interface StoredZaloToken {
    oaId: string
    appId: string
    accessToken: string
    refreshToken: string
    expiresIn: number
    expiresAt: Date | null
    tokenType: string | null
    scope: string | null
}

@Injectable()
export class GetValidZaloAccessTokenUseCase {
    private static readonly EXPIRY_BUFFER_MS = 2 * 60 * 1000

    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(input: GetValidZaloAccessTokenInput): Promise<string | null> {
        const tokenRecord = await this.unitOfWork.executeInTransaction(async (repos) => {
            return repos.zaloTokenRepository.findByAppId(input.appId)
        })

        if (!tokenRecord) {
            return null
        }

        if (!tokenRecord.accessToken) {
            return this.refreshAccessToken(tokenRecord)
        }

        if (!this.isTokenExpired(tokenRecord.expiresAt)) {
            return tokenRecord.accessToken
        }

        return this.refreshAccessToken(tokenRecord)
    }

    private isTokenExpired(expiresAt: Date | null): boolean {
        if (!expiresAt) {
            return false
        }

        return expiresAt.getTime() <= Date.now() + GetValidZaloAccessTokenUseCase.EXPIRY_BUFFER_MS
    }

    private async refreshAccessToken(tokenRecord: StoredZaloToken): Promise<string | null> {
        const secretKey = process.env.ZALO_OA_SECRET_KEY
        if (!secretKey || !tokenRecord.refreshToken) {
            return null
        }

        const formData = new URLSearchParams()
        formData.append('refresh_token', tokenRecord.refreshToken)
        formData.append('app_id', tokenRecord.appId)
        formData.append('grant_type', 'refresh_token')

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
                oa_id?: string
                app_id?: string
                access_token?: string
                refresh_token?: string
                expires_in?: number | string
                token_type?: string
                scope?: string
            }

            if (!tokenData.access_token) {
                return null
            }

            const refreshedAccessToken = tokenData.access_token

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
                    oaId: tokenData.oa_id || tokenRecord.oaId,
                    appId: tokenData.app_id || tokenRecord.appId,
                    accessToken: refreshedAccessToken,
                    refreshToken: tokenData.refresh_token || tokenRecord.refreshToken,
                    expiresIn,
                    expiresAt,
                    tokenType: tokenData.token_type,
                    scope: tokenData.scope,
                })
            })

            return refreshedAccessToken
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error_description ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to refresh Zalo access token'

            console.warn('[Zalo Token] Không thể refresh access token:', {
                appId: tokenRecord.appId,
                oaId: tokenRecord.oaId,
                errorMessage,
            })

            return null
        }
    }
}
