import { oldDb, newDb } from './db-clients';
import { MigrationResult } from './types';
import { logProgress, logResult, processBatch } from './utils';

/**
 * Template migrator - Copy và chỉnh sửa file này cho entity mới
 * 
 * CÁCH SỬ DỤNG:
 * 1. Copy file này thành migrate-<entity>.ts
 * 2. Đổi tên hàm và update logic
 * 3. Thêm vào index.ts
 */

export async function migrateTemplate() {
  console.log('🚀 Starting Template migration...');

  const result: MigrationResult = {
    successCount: 0,
    skipCount: 0,
    errorCount: 0,
    total: 0,
  };

  try {
    // ============================================
    // BƯỚC 1: Đọc dữ liệu từ old_db
    // ============================================
    
    // TODO: Thay đổi model name
    // const oldRecords = await oldDb.oldModelName.findMany({
    //   // include relations if needed
    //   // include: { ... }
    // });
    
    // result.total = oldRecords.length;
    // console.log(`📊 Found ${result.total} records in old database`);

    // if (result.total === 0) {
    //   console.log('⚠️  No records found, skipping...');
    //   return result;
    // }

    // ============================================
    // BƯỚC 2: Process từng record
    // ============================================
    
    // for (let i = 0; i < oldRecords.length; i++) {
    //   const oldRecord = oldRecords[i];
      
    //   try {
    //     // 1. Kiểm tra đã tồn tại chưa
    //     const existing = await newDb.modelName.findUnique({
    //       where: { 
    //         // TODO: unique field
    //         // id: oldRecord.id 
    //       },
    //     });

    //     if (existing) {
    //       result.skipCount++;
    //       logProgress('Template', i + 1, result.total, `Skipped (already exists)`);
    //       continue;
    //     }

    //     // 2. Transform data (mapping từ old sang new)
    //     const newData = {
    //       // TODO: Map fields từ oldRecord sang newRecord
    //       // field1: oldRecord.field1,
    //       // field2: oldRecord.field2 || 'default',
    //       // newField: null, // field mới
    //     };

    //     // 3. Insert vào new_db
    //     await newDb.modelName.create({
    //       data: newData,
    //     });

    //     result.successCount++;
    //     logProgress('Template', i + 1, result.total, `✅ Success`);

    //   } catch (error) {
    //     result.errorCount++;
    //     console.error(`❌ Error at record ${i + 1}:`, error.message);
    //     // Continue với record tiếp theo
    //   }
    // }

    // ============================================
    // BƯỚC 3: Log kết quả
    // ============================================
    
    logResult('Template', result);
    
    // Placeholder cho demo
    console.log('⚠️  Template migration not yet implemented');
    console.log('📝 Please update this file with actual migration logic');

    return result;

  } catch (error) {
    console.error('❌ Template migration failed:', error);
    throw error;
  }
}

/**
 * BATCH PROCESSING VERSION
 * Sử dụng cho tables lớn (>10000 records)
 */
export async function migrateTemplateBatch() {
  console.log('🚀 Starting Template migration (Batch mode)...');

  const result: MigrationResult = {
    successCount: 0,
    skipCount: 0,
    errorCount: 0,
    total: 0,
  };

  try {
    // Count total
    // const total = await oldDb.oldModelName.count();
    // result.total = total;

    const batchSize = 100;
    let skip = 0;

    // while (skip < total) {
    //   console.log(`\n📦 Processing batch ${skip / batchSize + 1}...`);
      
    //   const batch = await oldDb.oldModelName.findMany({
    //     skip,
    //     take: batchSize,
    //   });

    //   for (const oldRecord of batch) {
    //     try {
    //       // Same logic as above
    //       // ...
    //       result.successCount++;
    //     } catch (error) {
    //       result.errorCount++;
    //       console.error(`❌ Error:`, error.message);
    //     }
    //   }

    //   skip += batchSize;
    // }

    logResult('Template (Batch)', result);

    return result;

  } catch (error) {
    console.error('❌ Template batch migration failed:', error);
    throw error;
  }
}
