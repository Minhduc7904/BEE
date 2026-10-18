import { DeletedParentAccount } from '../entities/user/deleted-parent-account.entity'
import { ParentAccountDeletionSource } from '../enums/parent-account-deletion-source.enum'

export interface DeleteParentAccountData {
  userId: number
  parentId: number
  phoneLookupHash: string
  source: ParentAccountDeletionSource
  deletedAt: Date
  anonymousUsername: string
  anonymousPhone: string
  replacementPasswordHash: string
}

export interface IParentAccountDeletionRepository {
  findByPhoneLookupHash(phoneLookupHash: string): Promise<DeletedParentAccount | null>
  deleteAccount(data: DeleteParentAccountData): Promise<DeletedParentAccount>
  allowRegistration(phoneLookupHash: string): Promise<boolean>
}
