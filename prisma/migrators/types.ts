export interface MigrationResult {
  successCount: number;
  skipCount: number;
  errorCount: number;
  total: number;
}

export interface MigrationStats {
  entity: string;
  result: MigrationResult;
  duration: number;
}

export interface MigrationOptions {
  skipExisting?: boolean;
  dryRun?: boolean;
  batchSize?: number;
  verbose?: boolean;
}

export type MigrationFunction = (
  options?: MigrationOptions
) => Promise<MigrationResult>;
