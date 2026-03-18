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
}
