import { oldDb, newDb } from './db-clients';

/**
 * Migrate Subjects từ old_db sang new_db
 */
export async function migrateSubjects() {
  console.log('🚀 Starting Subject migration...');

  try {
    // TODO: Implement subject migration
    console.log('⚠️  Subject migration not yet implemented');
    
    return { successCount: 0, skipCount: 0, errorCount: 0, total: 0 };
  } catch (error) {
    console.error('❌ Subject migration failed:', error);
    throw error;
  }
}
