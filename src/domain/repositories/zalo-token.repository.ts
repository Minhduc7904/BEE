export interface UpsertZaloTokenData {
  oaId: string
  appId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt?: Date | null
  tokenType?: string
  scope?: string
}

export interface IZaloTokenRepository {
  upsertByOaAndApp(data: UpsertZaloTokenData): Promise<void>
  findByAppId(appId: string): Promise<{
    oaId: string
    appId: string
    accessToken: string
    refreshToken: string
    expiresIn: number
    expiresAt: Date | null
    tokenType: string | null
    scope: string | null
  } | null>
}
