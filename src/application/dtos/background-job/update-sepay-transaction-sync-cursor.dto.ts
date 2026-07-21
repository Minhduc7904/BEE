import type { UpdateSepayTransactionSyncCursorData } from '../../../domain/interface/sepay'
import { IsOptionalDate, IsOptionalString } from '../../../shared/decorators/validate'

export class UpdateSepayTransactionSyncCursorDto {
  @IsOptionalString('Checkpoint đồng bộ SePay', 36)
  lastSinceId?: string | null

  @IsOptionalDate('Thời điểm đồng bộ gần nhất')
  lastSyncedAt?: string | null

  @IsOptionalDate('Thời điểm lỗi gần nhất')
  lastErrorAt?: string | null

  @IsOptionalString('Thông báo lỗi gần nhất', 1000)
  lastErrorMessage?: string | null

  hasChanges(): boolean {
    return (
      this.lastSinceId !== undefined ||
      this.lastSyncedAt !== undefined ||
      this.lastErrorAt !== undefined ||
      this.lastErrorMessage !== undefined
    )
  }

  toUpdateData(): UpdateSepayTransactionSyncCursorData {
    return {
      ...(this.lastSinceId !== undefined && { lastSinceId: this.lastSinceId }),
      ...(this.lastSyncedAt !== undefined && {
        lastSyncedAt: this.lastSyncedAt ? new Date(this.lastSyncedAt) : null,
      }),
      ...(this.lastErrorAt !== undefined && {
        lastErrorAt: this.lastErrorAt ? new Date(this.lastErrorAt) : null,
      }),
      ...(this.lastErrorMessage !== undefined && { lastErrorMessage: this.lastErrorMessage }),
    }
  }
}
