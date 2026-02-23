import { MigrationResult, MigrationOptions } from './types';

/**
 * Tạo kết quả migration rỗng
 */
export function createEmptyResult(): MigrationResult {
  return {
    successCount: 0,
    skipCount: 0,
    errorCount: 0,
    total: 0,
  };
}

/**
 * Log migration progress
 */
export function logProgress(
  entity: string,
  current: number,
  total: number,
  message: string
) {
  const percentage = ((current / total) * 100).toFixed(1);
  console.log(`[${current}/${total}] (${percentage}%) ${entity}: ${message}`);
}

/**
 * Log migration result
 */
export function logResult(entity: string, result: MigrationResult) {
  console.log(`\n📈 ${entity} Migration Summary:`);
  console.log(`  ✅ Success: ${result.successCount}`);
  console.log(`  ⏭️  Skipped: ${result.skipCount}`);
  console.log(`  ❌ Errors: ${result.errorCount}`);
  console.log(`  📊 Total: ${result.total}`);
}

/**
 * Sleep function cho rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch processing helper
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    // Delay giữa các batch để tránh overwhelm database
    if (i + batchSize < items.length) {
      await sleep(100);
    }
  }
  
  return results;
}

/**
 * Sanitize string - loại bỏ ký tự đặc biệt, emoji
 */
export function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  
  // Loại bỏ emoji và ký tự đặc biệt
  return str
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .trim();
}

/**
 * Parse date string - xử lý nhiều format khác nhau
 */
export function parseDate(
  dateStr: string | Date | null | undefined
): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Safe number parse
 */
export function parseNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Generate unique slug từ string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')     // Remove special chars
    .replace(/\s+/g, '-')             // Replace spaces with -
    .replace(/-+/g, '-')              // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');         // Trim - from start/end
}

/**
 * Validate email
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}
