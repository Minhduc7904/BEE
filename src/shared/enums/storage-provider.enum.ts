// src/shared/enums/storage-provider.enum.ts

/**
 * Storage Provider Enum
 * Đồng bộ với Prisma schema enum StorageProvider
 */
export enum StorageProvider {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  GCS = 'GCS',
  SUPABASE = 'SUPABASE',
  EXTERNAL = 'EXTERNAL',
}

/**
 * Storage Provider Labels để hiển thị UI
 */
export const StorageProviderLabels: Record<StorageProvider, string> = {
  [StorageProvider.LOCAL]: 'Local Storage',
  [StorageProvider.S3]: 'Amazon S3',
  [StorageProvider.GCS]: 'Google Cloud Storage',
  [StorageProvider.SUPABASE]: 'Supabase Storage',
  [StorageProvider.EXTERNAL]: 'External URL',
}

/**
 * Storage Provider Options cho dropdown/select
 */
export const StorageProviderOptions = Object.entries(StorageProviderLabels).map(([value, label]) => ({
  value: value as StorageProvider,
  label,
}))

/**
 * Validate storage provider
 */
export const isValidStorageProvider = (value: string): value is StorageProvider => {
  return Object.values(StorageProvider).includes(value as StorageProvider)
}
