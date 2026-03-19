import { Injectable } from '@nestjs/common'
import type { IZaloTokenRepository, UpsertZaloTokenData } from '../../../domain/repositories/zalo-token.repository'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class PrismaZaloTokenRepository implements IZaloTokenRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async upsertByOaAndApp(data: UpsertZaloTokenData): Promise<void> {
        await this.prisma.zaloToken.upsert({
            where: {
                oaId_appId: {
                    oaId: data.oaId,
                    appId: data.appId,
                },
            },
            create: {
                oaId: data.oaId,
                appId: data.appId,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                expiresAt: data.expiresAt,
                tokenType: data.tokenType,
                scope: data.scope,
            },
            update: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                expiresAt: data.expiresAt,
                tokenType: data.tokenType,
                scope: data.scope,
            },
        })
    }

    async findByAppId(appId: string): Promise<{
        oaId: string
        appId: string
        accessToken: string
        refreshToken: string
        expiresIn: number
        expiresAt: Date | null
        tokenType: string | null
        scope: string | null
    } | null> {
        const token = await this.prisma.zaloToken.findFirst({
            where: { appId },
            orderBy: { updatedAt: 'desc' },
            select: {
                oaId: true,
                appId: true,
                accessToken: true,
                refreshToken: true,
                expiresIn: true,
                expiresAt: true,
                tokenType: true,
                scope: true,
            },
        })

        if (!token) return null

        return {
            oaId: token.oaId,
            appId: token.appId,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            expiresIn: token.expiresIn,
            expiresAt: token.expiresAt,
            tokenType: token.tokenType,
            scope: token.scope,
        }
    }
}
