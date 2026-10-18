import { ParentAccountDeletionSource } from '../../enums/parent-account-deletion-source.enum'

export class DeletedParentAccount {
  constructor(
    public readonly deletionId: number,
    public readonly phoneLookupHash: string,
    public readonly anonymousUserId: number,
    public readonly source: ParentAccountDeletionSource,
    public readonly deletedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
