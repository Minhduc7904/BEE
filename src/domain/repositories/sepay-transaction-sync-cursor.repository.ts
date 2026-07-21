import { SepayTransactionSyncCursor } from '../entities/sepay'
import type {
  CreateSepayTransactionSyncCursorData,
  SepayTransactionSyncCursorListOptions,
  UpdateSepayTransactionSyncCursorData,
} from '../interface/sepay'

export interface ISepayTransactionSyncCursorRepository {
  create(data: CreateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor>
  findByScope(scope: string): Promise<SepayTransactionSyncCursor | null>
  findAll(
    options: SepayTransactionSyncCursorListOptions,
  ): Promise<{ data: SepayTransactionSyncCursor[]; total: number }>
  upsert(data: CreateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor>
  updateByScope(scope: string, data: UpdateSepayTransactionSyncCursorData): Promise<SepayTransactionSyncCursor>
}
