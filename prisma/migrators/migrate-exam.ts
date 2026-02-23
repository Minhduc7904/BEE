import { oldDb, newDb } from './db-clients';
import { MediaMigrationHelper } from './migrate-media-helper';
import { ExamVisibility, QuestionType, Difficulty, MediaVisibility } from '@prisma/client';
import { TypeOfExam } from 'generated/prisma';
import { EntityType } from 'src/shared/constants/entity-type.constants';
import { EXAM_MEDIA_FIELDS, QUESTION_MEDIA_FIELDS, STATEMENT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants';

/**
 * Migrate Exams từ old_db sang new_db
 * - Tách exam cũ thành Exam mới và Competition
 * - Chỉ migrate questions có sử dụng trong exam
 * - Upload media cho exam và questions
 * - Map chapter code từ bảng chapters
 */
export async function migrateExams() {
    console.log('🚀 Starting Exam migration...');

    const mediaHelper = new MediaMigrationHelper();
    await mediaHelper.initialize();

    // Map để tracking migrated questions: oldQuestionId → newQuestionId
    const migratedQuestions = new Map<number, number>();

    // Giả sử admin ID = 1 (Teacher/Admin default)
    const DEFAULT_ADMIN_ID = 1;
    const DEFAULT_SUBJECT_ID = 1; // Toán

    try {
        const oldExams = await oldDb.oldExam.findMany({
            include: {
                classCode: true,
                typeCode: true,
                examQuestions: {
                    include: {
                        question: {
                            include: {
                                statements: true,
                                classCode: true,
                                typeCode: true,
                                difficultyCode: true,
                                chapterCode: true,
                            }
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
                yearCode: true,
                chapterCode: true,
            },
        });

        console.log(`📊 Found ${oldExams.length} exams in old database`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const oldExam of oldExams) {
            try {
                console.log(`\n📝 Processing: ${oldExam.name}`);

                // === 1. MAP DATA ===
                const grade = mapGradeFromClass(oldExam.class);
                const visibility = oldExam.public ? ExamVisibility.PUBLISHED : ExamVisibility.DRAFT;

                // === 2. TẠO EXAM MỚI ===
                const newExam = await newDb.exam.create({
                    data: {
                        title: oldExam.name,
                        description: oldExam.description,
                        grade,
                        subjectId: DEFAULT_SUBJECT_ID,
                        createdBy: DEFAULT_ADMIN_ID,
                        visibility,
                        solutionYoutubeUrl: oldExam.solutionUrl || null,
                        typeOfExam: mapTypeOfExam(oldExam.typeOfExam),
                        createdAt: oldExam.createdAt,
                        updatedAt: oldExam.updatedAt,
                    },
                });

                console.log(`✅ Created Exam: ${newExam.examId} - ${newExam.title}`);

                // === 3. UPLOAD MEDIA CHO EXAM ===
                if (oldExam.imageUrl) {
                    try {
                        await mediaHelper.migrateMedia(
                            oldExam.imageUrl,
                            'images',
                            EntityType.EXAM,
                            newExam.examId,
                            DEFAULT_ADMIN_ID,
                            EXAM_MEDIA_FIELDS.EXAM_IMAGE,
                        );
                        console.log(`  📸 Uploaded exam image`);
                    } catch (error: any) {
                        console.warn(`  ⚠️  Failed to upload exam image: ${error.message}`);
                    }
                }

                // Upload solution PDF nếu có
                if (oldExam.solutionPdfUrl) {
                    try {
                        await mediaHelper.migrateMedia(
                            oldExam.solutionPdfUrl,
                            'images',
                            EntityType.EXAM,
                            newExam.examId,
                            DEFAULT_ADMIN_ID,
                            EXAM_MEDIA_FIELDS.SOLUTION_FILE,
                        );
                        console.log(`  📄 Uploaded solution PDF`);
                    } catch (error: any) {
                        console.warn(`  ⚠️  Failed to upload solution PDF: ${error.message}`);
                    }
                }

                // Upload file URL nếu có
                if (oldExam.fileUrl) {
                    try {
                        await mediaHelper.migrateMedia(
                            oldExam.fileUrl,
                            'images',
                            EntityType.EXAM,
                            newExam.examId,
                            DEFAULT_ADMIN_ID,
                            EXAM_MEDIA_FIELDS.EXAM_FILE,
                        );
                        console.log(`  📎 Uploaded exam file`);
                    } catch (error: any) {
                        console.warn(`  ⚠️  Failed to upload exam file: ${error.message}`);
                    }
                }

                // === 4. TẠO COMPETITION NẾU LÀ CLASSROOM EXAM ===
                if (oldExam.isClassroomExam) {
                    try {
                        const competition = await newDb.competition.create({
                            data: {
                                title: `[Classroom] ${oldExam.name}`,
                                description: oldExam.description,
                                grade,
                                subjectId: DEFAULT_SUBJECT_ID,
                                examId: newExam.examId,
                                createdBy: DEFAULT_ADMIN_ID,
                                visibility,
                                startDate: new Date(), // Default start date
                                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm sau
                                duration: oldExam.testDuration || 60,
                                maxAttempts: oldExam.attemptLimit || 1,
                                enableCheatingDetection: oldExam.isCheatingCheckEnabled,
                                showCorrectAnswers: oldExam.seeCorrectAnswer,
                                createdAt: oldExam.createdAt,
                                updatedAt: oldExam.updatedAt,
                            },
                        });
                        console.log(`  🏆 Created Competition: ${competition.competitionId}`);
                    } catch (error: any) {
                        console.warn(`  ⚠️  Failed to create competition: ${error.message}`);
                    }
                }

                // === 5. TẠO SECTION MẶC ĐỊNH ===
                const section = await newDb.section.create({
                    data: {
                        examId: newExam.examId,
                        title: 'Phần 1',
                        description: null,
                        order: 1,
                    },
                });
                console.log(`  📋 Created Section: ${section.sectionId}`);

                // === 6. MIGRATE QUESTIONS CÓ TRONG EXAM ===
                let questionOrder = 1;
                let questionsMigrated = 0;
                let questionsLinked = 0;

                for (const examQuestion of oldExam.examQuestions) {
                    try {
                        const oldQuestion = examQuestion.question;
                        let newQuestionId: number;

                        // Check nếu question đã được migrate
                        if (migratedQuestions.has(oldQuestion.id)) {
                            newQuestionId = migratedQuestions.get(oldQuestion.id)!;
                            console.log(`  ♻️  Reusing question ${newQuestionId} (old ID: ${oldQuestion.id})`);
                        } else {
                            // Migrate question mới
                            const questionType = mapQuestionType(oldQuestion.typeOfQuestion);
                            const difficulty = oldQuestion.difficulty ? mapDifficulty(oldQuestion.difficulty) : null;
                            const slug = generateSlug(oldQuestion.content, oldQuestion.id);

                            const newQuestion = await newDb.question.create({
                                data: {
                                    content: oldQuestion.content || '',
                                    slug,
                                    solution: oldQuestion.solution || null,
                                    type: questionType,
                                    difficulty,
                                    correctAnswer: oldQuestion.correctAnswer,
                                    subjectId: DEFAULT_SUBJECT_ID,
                                    createdBy: DEFAULT_ADMIN_ID,
                                    visibility,
                                    createdAt: oldQuestion.createdAt,
                                    updatedAt: oldQuestion.updatedAt,
                                },
                            });

                            newQuestionId = newQuestion.questionId;
                            migratedQuestions.set(oldQuestion.id, newQuestionId);
                            console.log(`  ✅ Migrated Question: ${newQuestionId} (old ID: ${oldQuestion.id})`);
                            questionsMigrated++;

                            // Upload question image nếu có
                            if (oldQuestion.imageUrl) {
                                try {
                                    await mediaHelper.migrateMedia(
                                        oldQuestion.imageUrl,
                                        'images',
                                        EntityType.QUESTION,
                                        newQuestionId,
                                        DEFAULT_ADMIN_ID,
                                        QUESTION_MEDIA_FIELDS.CONTENT,
                                    );
                                    console.log(`    📸 Uploaded question image`);
                                } catch (error: any) {
                                    console.warn(`    ⚠️  Failed to upload question image: ${error.message}`);
                                }
                            }

                            // Migrate statements
                            for (let i = 0; i < oldQuestion.statements.length; i++) {
                                const oldStatement = oldQuestion.statements[i];
                                const newStatement = await newDb.statement.create({
                                    data: {
                                        questionId: newQuestionId,
                                        content: oldStatement.content || '',
                                        isCorrect: oldStatement.isCorrect,
                                        order: i + 1,
                                    },
                                });

                                // Upload statement image nếu có
                                if (oldStatement.imageUrl) {
                                    try {
                                        await mediaHelper.migrateMedia(
                                            oldStatement.imageUrl,
                                            'images',
                                            EntityType.STATEMENT,
                                            newStatement.statementId,
                                            DEFAULT_ADMIN_ID,
                                            STATEMENT_MEDIA_FIELDS.CONTENT,
                                        );
                                        console.log(`    📸 Uploaded statement ${i + 1} image`);
                                    } catch (error: any) {
                                        console.warn(`    ⚠️  Failed to upload statement image: ${error.message}`);
                                    }
                                }
                            }

                            // Gắn chapter cho question nếu có
                            if (oldQuestion.chapter) {
                                const chapter = await findChapterByCode(oldQuestion.chapter);
                                if (chapter) {
                                    await newDb.questionChapter.create({
                                        data: {
                                            questionId: newQuestionId,
                                            chapterId: chapter.chapterId,
                                        },
                                    });
                                    console.log(`    📚 Linked to chapter: ${chapter.name}`);
                                }
                            }
                        }

                        // Link question với exam
                        await newDb.questionExam.create({
                            data: {
                                questionId: newQuestionId,
                                examId: newExam.examId,
                                sectionId: section.sectionId,
                                order: questionOrder++,
                                points: 1, // Default 1 điểm
                            },
                        });
                        questionsLinked++;

                    } catch (error: any) {
                        console.error(`  ❌ Error migrating question ${examQuestion.questionId}:`, error.message);
                    }
                }

                console.log(`  📊 Questions: ${questionsMigrated} migrated, ${questionsLinked} linked`);

                successCount++;
                console.log(`✅ [${successCount}/${oldExams.length}] Completed: ${oldExam.name}`);

            } catch (error: any) {
                errorCount++;
                console.error(`❌ Error migrating exam ${oldExam.id}:`, error.message);
            }
        }

        console.log('\n📈 Exam Migration Summary:');
        console.log(`  ✅ Success: ${successCount}`);
        console.log(`  ⏭️  Skipped: ${skipCount}`);
        console.log(`  ❌ Errors: ${errorCount}`);
        console.log(`  📊 Total: ${oldExams.length}`);
        console.log(`  🔢 Unique Questions Migrated: ${migratedQuestions.size}`);

        return { successCount, skipCount, errorCount, total: oldExams.length };

    } catch (error) {
        console.error('❌ Exam migration failed:', error);
        throw error;
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate slug from question content
 */
function generateSlug(content: string, oldId: number): string {
    // Strip HTML/markdown, lấy 50 ký tự đầu
    const cleanContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[\n\r]/g, ' ') // Replace newlines
        .replace(/\s+/g, '-') // Replace spaces with dash
        .replace(/[^a-zA-Z0-9-]/g, '') // Remove special chars
        .toLowerCase()
        .substring(0, 50);
    
    return `${cleanContent}-${oldId}-${Date.now()}`;
}

/**
 * Map grade từ class code (L10 → 10, L11 → 11, L12 → 12)
 */
function mapGradeFromClass(classCode: string): number {
    const match = classCode.match(/L?(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    return 10; // Default grade 10
}

/**
 * Map TypeOfExam từ old type
 */
function mapTypeOfExam(oldType: string): TypeOfExam | null {
    const typeMap: Record<string, TypeOfExam> = {
        'CK1': 'CK1' as TypeOfExam,
        'CK2': 'CK2' as TypeOfExam,
        'GK1': 'GK1' as TypeOfExam,
        'GK2': 'GK2' as TypeOfExam,
        'TSA': 'TSA' as TypeOfExam,
        'THPT': 'THPT' as TypeOfExam,
        'OTTHPT': 'OTTHPT' as TypeOfExam,
        'OT': 'OT' as TypeOfExam,
        'HSA': 'HSA' as TypeOfExam,
        'OTHS': 'OTHS' as TypeOfExam,
    };
    return typeMap[oldType] || null;
}

/**
 * Map QuestionType từ old type
 */
function mapQuestionType(oldType: string): QuestionType {
    const typeMap: Record<string, QuestionType> = {
        'TN': QuestionType.SINGLE_CHOICE,
        'TL': QuestionType.SHORT_ANSWER,
        'DD': QuestionType.TRUE_FALSE,
    };
    return typeMap[oldType] || QuestionType.SINGLE_CHOICE;
}

/**
 * Map Difficulty từ old difficulty
 */
function mapDifficulty(oldDifficulty: string): Difficulty {
    const difficultyMap: Record<string, Difficulty> = {
        'TH': Difficulty.TH,
        'NB': Difficulty.NB,
        'VD': Difficulty.VD,
        'VDC': Difficulty.VDC,
    };
    return difficultyMap[oldDifficulty] || Difficulty.NB;
}

/**
 * Tìm chapter bằng code trong bảng chapters
 */
async function findChapterByCode(code: string): Promise<{ chapterId: number; name: string } | null> {
    try {
        const chapter = await newDb.chapter.findUnique({
            where: { code },
            select: { chapterId: true, name: true },
        });
        return chapter;
    } catch (error) {
        return null;
    }
}

// Run migration if executed directly
if (require.main === module) {
    const { connectDatabases, disconnectDatabases } = require('./db-clients');

    connectDatabases()
        .then(() => migrateExams())
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