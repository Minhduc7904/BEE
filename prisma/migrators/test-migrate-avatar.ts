import { MediaMigrationHelper } from './migrate-media-helper';
import { newDb } from './db-clients';
import { connectDatabases, disconnectDatabases } from './db-clients';

/**
 * Test script để test migrate avatar
 */
async function testMigrateAvatar() {
    console.log('🧪 Testing avatar migration...\n');

    try {
        // Connect databases
        await connectDatabases();

        // Initialize media helper
        const mediaHelper = new MediaMigrationHelper();
        await mediaHelper.initialize();

        // Test với 1 user có avatar
        // Giả sử avatarUrl: "avatar/1753627352862-tải xuống (1).jfif"
        const testAvatarUrl = 'avatar/1753627352862-tải xuống (1).jfif';
        const testUserId = 1; // Thay bằng userId thật của user trong DB

        console.log(`📸 Testing avatar migration:`);
        console.log(`   Avatar URL: ${testAvatarUrl}`);
        console.log(`   User ID: ${testUserId}\n`);

        // Migrate avatar
        const media = await mediaHelper.migrateUserAvatar(testAvatarUrl, testUserId);

        if (media) {
            console.log('\n✅ Avatar migration successful!');
            console.log(`   Media ID: ${media.mediaId}`);
            console.log(`   Bucket: ${media.bucketName}`);
            console.log(`   Object Key: ${media.objectKey}`);
            console.log(`   File Size: ${media.fileSize} bytes`);

            // Query MediaUsage
            const usage = await newDb.mediaUsage.findFirst({
                where: {
                    mediaId: media.mediaId,
                    entityType: 'USER',
                },
            });

            if (usage) {
                console.log(`\n📋 MediaUsage created:`);
                console.log(`   Usage ID: ${usage.usageId}`);
                console.log(`   Entity Type: ${usage.entityType}`);
                console.log(`   Entity ID: ${usage.entityId}`);
                console.log(`   Field Name: ${usage.fieldName}`);
            }
        } else {
            console.log('\n⚠️  Avatar migration returned null (file might not exist in backup)');
        }
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        throw error;
    } finally {
        await disconnectDatabases();
    }
}

// Run test
if (require.main === module) {
    testMigrateAvatar()
        .then(() => {
            console.log('\n✨ Test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}
