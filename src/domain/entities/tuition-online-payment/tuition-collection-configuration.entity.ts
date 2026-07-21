import { TuitionCollectionMode } from '../../../shared/enums'

export class TuitionCollectionConfiguration {
  tuitionCollectionConfigurationId: number
  collectionMode: TuitionCollectionMode
  defaultManualReceivingBankAccountId: number
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    tuitionCollectionConfigurationId: number
    collectionMode?: TuitionCollectionMode
    defaultManualReceivingBankAccountId: number
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.tuitionCollectionConfigurationId = data.tuitionCollectionConfigurationId
    this.collectionMode = data.collectionMode ?? TuitionCollectionMode.AUTOMATIC
    this.defaultManualReceivingBankAccountId = data.defaultManualReceivingBankAccountId
    this.createdAt = data.createdAt ?? new Date()
    this.updatedAt = data.updatedAt ?? new Date()
  }

  usesManualFallback(): boolean {
    return this.collectionMode === TuitionCollectionMode.MANUAL_FALLBACK
  }
}
