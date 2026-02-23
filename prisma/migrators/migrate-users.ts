import { oldDb, newDb } from './db-clients';
import bcrypt from 'bcrypt';
import { Gender } from '@prisma/client';
import { MediaMigrationHelper } from './migrate-media-helper';

const SALT_ROUNDS = 10;

/**
 * Migrate Users từ old_db sang new_db
 * - Hash lại password
 * - Nếu tồn tại → update
 * - Nếu chưa tồn tại → create
 */
export async function migrateUsers() {
    console.log('🚀 Starting User migration...');

    const mediaHelper = new MediaMigrationHelper();
    await mediaHelper.initialize();

    try {
        const oldUsers = await oldDb.oldUser.findMany({
            include: {
                userTypeCode: true,
                classCode: true,
            },
        });

        console.log(`📊 Found ${oldUsers.length} users in old database`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const oldUser of oldUsers) {
            try {
                if (oldUser.userType !== 'HS1') {
                    skipCount++;
                    continue;
                }

                // Hash password mới
                const hashedPassword = await bcrypt.hash(
                    oldUser.password || '123456',
                    SALT_ROUNDS
                );

                // Map gender
                let gender: Gender | null = null;
                if (oldUser.gender === true) gender = Gender.MALE;
                if (oldUser.gender === false) gender = Gender.FEMALE;

                // Map grade
                let grade = 10;
                if (oldUser.class) {
                    const parsed = parseInt(oldUser.class);
                    if (!isNaN(parsed)) grade = parsed;
                }

                // Upsert User
                const user = await newDb.user.upsert({
                    where: { username: oldUser.username },
                    update: {
                        passwordHash: hashedPassword,
                        firstName: oldUser.firstName,
                        lastName: oldUser.lastName,
                        gender,
                        dateOfBirth: oldUser.birthDate,
                        isActive: oldUser.isActive,
                        updatedAt: oldUser.updatedAt ?? new Date(),
                    },
                    create: {
                        username: oldUser.username,
                        email: null,
                        passwordHash: hashedPassword,
                        firstName: oldUser.firstName,
                        lastName: oldUser.lastName,
                        gender,
                        dateOfBirth: oldUser.birthDate,
                        isActive: oldUser.isActive,
                        isEmailVerified: false,
                        emailVerifiedAt: null,
                        lastLoginAt: null,
                        createdAt: oldUser.createdAt ?? new Date(),
                        updatedAt: oldUser.updatedAt ?? new Date(),
                    },
                });

                // Upsert Student
                await newDb.student.upsert({
                    where: { userId: user.userId },
                    update: {
                        studentPhone: oldUser.password || '',
                        parentPhone: oldUser.phone || null,
                        grade,
                        school: oldUser.highSchool || null,
                    },
                    create: {
                        userId: user.userId,
                        studentPhone: oldUser.password || '',
                        parentPhone: oldUser.phone || null,
                        grade,
                        school: oldUser.highSchool || null,
                    },
                });

                // Avatar migrate
                if (oldUser.avatarUrl) {
                    try {
                        await mediaHelper.migrateUserAvatar(
                            oldUser.avatarUrl,
                            user.userId
                        );
                    } catch (avatarError: any) {
                        console.warn(
                            `⚠️  Avatar migrate failed for ${oldUser.username}: ${avatarError.message}`
                        );
                    }
                }

                successCount++;
                console.log(
                    `✅ [${successCount}/${oldUsers.length}] Synced: ${oldUser.username}`
                );
            } catch (error: any) {
                errorCount++;
                console.error(
                    `❌ Error migrating ${oldUser.username}:`,
                    error.message
                );
            }
        }

        console.log('\n📈 User Migration Summary:');
        console.log(`  ✅ Success: ${successCount}`);
        console.log(`  ⏭️  Skipped: ${skipCount}`);
        console.log(`  ❌ Errors: ${errorCount}`);
        console.log(`  📊 Total: ${oldUsers.length}`);

        return { successCount, skipCount, errorCount, total: oldUsers.length };
    } catch (error) {
        console.error('❌ User migration failed:', error);
        throw error;
    }
}

if (require.main === module) {
    const { connectDatabases, disconnectDatabases } = require('./db-clients');

    connectDatabases()
        .then(() => migrateUsers())
        .then(async () => {
            console.log('\n✨ Migration completed successfully!');
            await disconnectDatabases();
        })
        .catch(async (error: any) => {
            console.error('\n💥 Migration failed:', error);
            await disconnectDatabases();
            process.exit(1);
        });
}