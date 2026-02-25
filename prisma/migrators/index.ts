import { connectDatabases, disconnectDatabases } from './db-clients';
import { migrateUsers } from './migrate-users';
import { migrateExams } from './migrate-exam';
import { migrateClasses } from './migrate-class';
/**
 * Main migration script
 * Chạy các bước migration theo thứ tự:
 * 3. Users (người dùng)
 * 6. Exams (đề thi)
 */
async function main() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🔄 DATABASE MIGRATION SCRIPT           ║');
    console.log('║   Old DB → New DB                        ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    const startTime = Date.now();

    try {
        // Kết nối cả 2 databases
        await connectDatabases();

        const results = {
            users: { successCount: 0, skipCount: 0, errorCount: 0, total: 0 },
            exams: { successCount: 0, skipCount: 0, errorCount: 0, total: 0 },
            classes: { successCount: 0, skipCount: 0, errorCount: 0, total: 0 },
        
        };

        // 3. Migrate Users
        console.log('\n👤 STEP 3: Migrating Users...');
        results.users = await migrateUsers();

        // 6. Migrate Exams
        console.log('\n📚 STEP 6: Migrating Exams...');
        results.exams = await migrateExams();

        // Migrate Classes
        console.log('\n🏫 STEP 7: Migrating Classes...');
        results.classes = await migrateClasses();
        // Summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   📊 MIGRATION SUMMARY                   ║');
        console.log('╚═══════════════════════════════════════════╝');

        Object.entries(results).forEach(([entity, stats]) => {
            console.log(`\n${entity.toUpperCase()}:`);
            console.log(`  ✅ Success: ${stats.successCount}`);
            console.log(`  ⏭️  Skipped: ${stats.skipCount}`);
            console.log(`  ❌ Errors: ${stats.errorCount}`);
            console.log(`  📊 Total: ${stats.total}`);
        });

        const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.successCount, 0);
        const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipCount, 0);
        const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errorCount, 0);
        const totalRecords = Object.values(results).reduce((sum, r) => sum + r.total, 0);

        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   🎯 OVERALL TOTALS                      ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log(`  ✅ Total Success: ${totalSuccess}`);
        console.log(`  ⏭️  Total Skipped: ${totalSkipped}`);
        console.log(`  ❌ Total Errors: ${totalErrors}`);
        console.log(`  📊 Total Records: ${totalRecords}`);
        console.log(`  ⏱️  Duration: ${duration}s`);

        console.log('\n✨ Migration completed!\n');
    } catch (error) {
        console.error('\n💥 Migration failed with error:', error);
        process.exit(1);
    } finally {
        await disconnectDatabases();
    }
}

// Chạy migration
main();
