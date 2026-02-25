import { oldDb, newDb } from './db-clients';
import { Visibility, LearningItemType } from '@prisma/client';
import { MediaMigrationHelper } from './migrate-media-helper';
import { ENTITY_TYPES } from '../../src/shared/constants/entity-type.constants';
import { FIELD_NAMES } from '../../src/shared/constants';
/**
 * Danh sách class IDs muốn migrate
 * Thay đổi array này để chọn classes cụ thể
 */
/**
 * Map typeOfLearningItem từ old DB sang LearningItemType enum
 */
function mapLearningItemType(oldType: string | null): LearningItemType {
    if (!oldType) return LearningItemType.DOCUMENT;

    const mapping: Record<string, LearningItemType> = {
        'VID': LearningItemType.YOUTUBE,
        'VIDEO': LearningItemType.VIDEO,
        'DOC': LearningItemType.DOCUMENT,
        'BTVN': LearningItemType.HOMEWORK,
    };

    return mapping[oldType] || LearningItemType.DOCUMENT;
}

/**
 * Tìm hoặc tạo Admin user (teacher)
 */
async function findOrCreateTeacher(teacherName: string | null): Promise<number> {
    if (!teacherName) {
        return 1; // Default to super admin if no teacher name
    }

    if (teacherName == 'Thầy Bee') {
        const teacherId = await newDb.user.findFirst({
            where: { username: 'thaybee' },
        });
        if (teacherId) return teacherId.userId;
    }

    if (teacherName == 'Thầy Phú') {
        const teacherId = await newDb.user.findFirst({
            where: { username: 'thayphu' },
        });
        if (teacherId) return teacherId.userId;
    }

    if (teacherName == 'Cô Giang') {
        const teacherId = await newDb.user.findFirst({
            where: { username: 'cogiang' },
        });
        if (teacherId) return teacherId.userId;
    }

    if (teacherName == 'Thầy Minh') {
        const teacherId = await newDb.user.findFirst({
            where: { username: 'thayminh' },
        });
        if (teacherId) return teacherId.userId;
    }

    return 1;
}

/**
 * Migrate Classes (OldClass -> Course)
 */
export async function migrateClasses() {
    console.log('🚀 Starting Class -> Course migration...');
    const mediaHelper = new MediaMigrationHelper();
    await mediaHelper.initialize();

    let courseCount = 0;
    let lessonCount = 0;
    let learningItemCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
        const oldClasses = await oldDb.oldClass.findMany({
            include: {
                lessons: {
                    include: {
                        learningItems: true,
                        chapterCode: true,
                    },
                },
            },
        });

        console.log('📊 Found ' + oldClasses.length + ' classes to migrate');

        for (const oldClass of oldClasses) {
            try {
                // Check if course already migrated
                const existingCourse = await newDb.course.findUnique({
                    where: { courseId: oldClass.id },
                });

                if (existingCourse) {
                    skipCount++;
                    console.log('⏭️  Course already exists: ' + oldClass.name);
                    continue;
                }

                // Parse grade
                let grade = 10;
                if (oldClass.grade) {
                    const parsed = parseInt(oldClass.grade);
                    if (!isNaN(parsed)) grade = parsed;
                }

                // Find teacher
                const teacherId = await findOrCreateTeacher(oldClass.teacher);

                // Create Course
                const course = await newDb.course.create({
                    data: {
                        courseId: oldClass.id,
                        code: oldClass.classCode,
                        title: oldClass.name,
                        subtitle: null,
                        academicYear: oldClass.academicYear?.replace(/\s+/g, "") || null,
                        grade,
                        subjectId: 1, // Default subject
                        description: oldClass.description,
                        priceVND: 0,
                        visibility: Visibility.PRIVATE,
                        teacherId,
                        hasTuitionFee: false,
                        createdAt: oldClass.createdAt || new Date(),
                        updatedAt: oldClass.updatedAt || new Date(),
                    },
                });

                courseCount++;
                console.log('✅ Created course: ' + course.title);

                // Migrate Lessons
                if (oldClass.lessons && oldClass.lessons.length > 0) {
                    let orderInCourse = 0;

                    for (const oldLesson of oldClass.lessons) {
                        orderInCourse++;

                        const lesson = await newDb.lesson.create({
                            data: {
                                lessonId: oldLesson.id,
                                courseId: course.courseId,
                                title: oldLesson.name,
                                description: oldLesson.description,
                                visibility: Visibility.PUBLISHED,
                                orderInCourse,
                                teacherId,
                                allowTrial: false,
                                createdAt: oldLesson.createdAt || new Date(),
                                updatedAt: oldLesson.updatedAt || new Date(),
                            },
                        });

                        const chapter = await newDb.chapter.findFirst({
                            where: {
                                code: oldLesson.chapter,
                            },
                        });

                        if (chapter) {
                            await newDb.lessonChapter.create({
                                data: {
                                    lessonId: lesson.lessonId,
                                    chapterId: chapter.chapterId,
                                },
                            });
                        }

                        lessonCount++;

                        // Migrate LearningItems
                        if (oldLesson.learningItems && oldLesson.learningItems.length > 0) {
                            let learningItemOrder = 0;

                            for (const oldItem of oldLesson.learningItems) {
                                learningItemOrder++;

                                // Check if LearningItem already exists
                                let learningItem = await newDb.learningItem.findUnique({
                                    where: { learningItemId: oldItem.id },
                                });

                                if (!learningItem) {
                                    // Create LearningItem
                                    learningItem = await newDb.learningItem.create({
                                        data: {
                                            learningItemId: oldItem.id,
                                            type: mapLearningItemType(oldItem.typeOfLearningItem),
                                            title: oldItem.name,
                                            description: oldItem.description,
                                            createdBy: teacherId,
                                            createdAt: oldItem.createdAt || new Date(),
                                            updatedAt: oldItem.updatedAt || new Date(),
                                        },
                                    });
                                }

                                // Check if LessonLearningItem link already exists
                                const existingLink = await newDb.lessonLearningItem.findUnique({
                                    where: {
                                        lessonId_learningItemId: {
                                            lessonId: lesson.lessonId,
                                            learningItemId: learningItem.learningItemId,
                                        },
                                    },
                                });

                                if (!existingLink) {
                                    // Link to Lesson
                                    await newDb.lessonLearningItem.create({
                                        data: {
                                            lessonId: lesson.lessonId,
                                            learningItemId: learningItem.learningItemId,
                                            order: learningItemOrder,
                                        },
                                    });
                                }

                                // Create content based on type
                                const itemType = mapLearningItemType(oldItem.typeOfLearningItem);

                                if (itemType === LearningItemType.YOUTUBE && oldItem.url) {
                                    await newDb.youtubeContent.create({
                                        data: {
                                            content: 'Tài liệu video',
                                            learningItemId: learningItem.learningItemId,
                                            youtubeUrl: oldItem.url,
                                        },
                                    });
                                } else if (itemType === LearningItemType.DOCUMENT && oldItem.url) {
                                    const documentContent = await newDb.documentContent.create({
                                        data: {
                                            learningItemId: learningItem.learningItemId,
                                            content: 'Tài liệu',
                                        },
                                    });
                                    if (oldItem.url) {
                                        const media = await mediaHelper.migrateMedia(
                                            oldItem.url,
                                            ENTITY_TYPES.DOCUMENT_CONTENT,
                                            documentContent.documentContentId,
                                            teacherId,
                                            FIELD_NAMES.DOCUMENT_FILE
                                        );
                                    }
                                } else if (itemType === LearningItemType.HOMEWORK) {
                                    let competitionId: number | null = null;
                                    if (oldItem.url) {
                                        const exam = await newDb.exam.findUnique({
                                            where: { examId: oldItem.url ? parseInt(oldItem.url) : 0 },
                                        });
                                        if (exam) {
                                            const competition = await newDb.competition.findFirst({
                                                where: { examId: exam.examId },
                                            });
                                            if (competition) {
                                                competitionId = competition.competitionId;
                                            }
                                        }
                                    }
                                    await newDb.homeworkContent.create({
                                        data: {
                                            learningItemId: learningItem.learningItemId,
                                            content: 'Bài tập về nhà',
                                            dueDate: oldItem.deadline,
                                            allowLateSubmit: false,
                                            competitionId: competitionId,
                                        },
                                    });
                                }

                                learningItemCount++;
                            }
                        }
                    }
                }

                console.log('  📝 Lessons: ' + oldClass.lessons.length);
            } catch (error: any) {
                errorCount++;
                console.error('❌ Error migrating class ' + oldClass.name + ': ' + error.message);
            }
        }

        // Reset AUTO_INCREMENT
        try {
            await newDb.$executeRawUnsafe(`
                ALTER TABLE courses AUTO_INCREMENT = (SELECT COALESCE(MAX(course_id), 0)+1 FROM courses);
            `);

            await newDb.$executeRawUnsafe(`
                ALTER TABLE lessons AUTO_INCREMENT = (SELECT COALESCE(MAX(lesson_id), 0)+1 FROM lessons);
            `);

            await newDb.$executeRawUnsafe(`
                ALTER TABLE learning_items AUTO_INCREMENT = (SELECT COALESCE(MAX(learning_item_id), 0)+1 FROM learning_items);
            `);
        } catch (error: any) {
            console.warn('⚠️  Failed to reset AUTO_INCREMENT: ' + error.message);
        }

        const successCount = courseCount;

        console.log('\n✨ Migration completed');
        console.log('  ✅ Success: ' + successCount);
        console.log('  ⏭️  Skipped: ' + skipCount);
        console.log('  ❌ Errors: ' + errorCount);
        console.log('  📊 Total classes: ' + oldClasses.length);
        console.log('  📝 Lessons: ' + lessonCount);
        console.log('  📚 Learning Items: ' + learningItemCount);

        return { successCount, skipCount, errorCount, total: oldClasses.length };
    } catch (error) {
        console.error('❌ Class migration failed:', error);
        throw error;
    }
}

if (require.main === module) {
    const { connectDatabases, disconnectDatabases } = require('./db-clients');

    connectDatabases()
        .then(() => migrateClasses())
        .then(async () => {
            await disconnectDatabases();
        })
        .catch(async (err) => {
            console.error(err);
            await disconnectDatabases();
            process.exit(1);
        });
}
