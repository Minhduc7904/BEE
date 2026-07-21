import type { SepayTransactionSyncCursor as PrismaSepayTransactionSyncCursor } from '@prisma/client'

import { SepayTransactionSyncCursor } from '../../../domain/entities/sepay'

export class SepayTransactionSyncCursorMapper {
  static toDomain(
    prismaCursor: PrismaSepayTransactionSyncCursor | null | undefined,
  ): SepayTransactionSyncCursor | null {
    if (!prismaCursor) return null

    return new SepayTransactionSyncCursor({
      sepayTransactionSyncCursorId: prismaCursor.sepayTransactionSyncCursorId,
      scope: prismaCursor.scope,
      lastSinceId: prismaCursor.lastSinceId,
      lastSyncedAt: prismaCursor.lastSyncedAt,
      lastErrorAt: prismaCursor.lastErrorAt,
      lastErrorMessage: prismaCursor.lastErrorMessage,
      createdAt: prismaCursor.createdAt,
      updatedAt: prismaCursor.updatedAt,
    })
  }
}
