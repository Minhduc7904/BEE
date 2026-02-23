import { oldDb, newDb } from './db-clients';

/**
 * Migrate Questions từ old_db sang new_db
 */
export async function migrateQuestions() {
  console.log('🚀 Starting Question migration...');

  try {
    // TODO: Implement question migration
    console.log('⚠️  Question migration not yet implemented');
    
    return { successCount: 0, skipCount: 0, errorCount: 0, total: 0 };
  } catch (error) {
    console.error('❌ Question migration failed:', error);
    throw error;
  }
}
