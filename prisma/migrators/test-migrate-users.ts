import { oldDb, newDb } from './db-clients';

/**
 * Test migration - chỉ đọc và hiển thị dữ liệu, không insert
 */
async function testMigration() {
    console.log('🧪 Testing User Migration (Dry Run)...\n');

    try {
        await oldDb.$connect();
        await newDb.$connect();
        console.log('✅ Connected to both databases\n');

        // Đọc sample users từ old DB
        const oldUsers = await oldDb.oldUser.findMany({
            include: {
                userTypeCode: true,
                classCode: true,
            },
        });

        console.log(`📊 Sample of ${oldUsers.length} users from old database:\n`);

        oldUsers.forEach((user, index) => {
            if (user.avatarUrl) {
                console.log(`${index + 1}. User: ${user.username}`);
                console.log(`   Avatar URL: ${user.avatarUrl}`);
            }
        });

        // Check existing users in new DB
        const existingCount = await newDb.user.count();
        console.log(`📈 Existing users in new database: ${existingCount}\n`);

        // Total users in old DB
        const totalOldUsers = await oldDb.oldUser.count();
        console.log(`📊 Total users to migrate: ${totalOldUsers}\n`);

        console.log('✨ Test completed! Ready to migrate.\n');
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await oldDb.$disconnect();
        await newDb.$disconnect();
    }
}

testMigration();
