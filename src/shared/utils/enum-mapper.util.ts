// src/shared/utils/enum-mapper.util.ts
import { StorageProvider as PrismaStorageProvider } from '@prisma/client';
import { StorageProvider } from '../enums/storage-provider.enum';

/**
 * Mapper để convert giữa custom enum và Prisma enum
 */
export class EnumMapper {
  /**
   * Convert từ custom StorageProvider sang Prisma StorageProvider
   */
  static toPrismaStorageProvider(
    storageProvider: StorageProvider,
  ): PrismaStorageProvider {
    return storageProvider as PrismaStorageProvider;
  }

  /**
   * Convert từ Prisma StorageProvider sang custom StorageProvider
   */
  static fromPrismaStorageProvider(
    prismaStorageProvider: PrismaStorageProvider,
  ): StorageProvider {
    return prismaStorageProvider as StorageProvider;
  }

  /**
   * Validate xem giá trị có phải là valid StorageProvider không
   */
  static isValidStorageProvider(value: any): value is StorageProvider {
    return Object.values(StorageProvider).includes(value);
  }
}
