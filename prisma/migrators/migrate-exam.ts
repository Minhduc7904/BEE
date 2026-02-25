import { oldDb, newDb } from './db-clients';
import { MediaMigrationHelper, extractMinioPath } from './migrate-media-helper';
import {
    ExamVisibility,
    Difficulty,
    QuestionType,
    Visibility,
} from '@prisma/client';
import { TypeOfExam } from '../../generated/prisma';
import { EntityType } from '../../src/shared/constants/entity-type.constants';
import {
    STATEMENT_MEDIA_FIELDS,
    QUESTION_CONTENT_FIELDS,
} from '../../src/shared/constants/media-field-name.constants';

/* -------------------------------------------------- */
/* ------------------ UTIL FUNCTIONS ---------------- */
/* -------------------------------------------------- */

async function replaceMarkdownImagesWithMedia(
    text: string,
    mediaHelper: MediaMigrationHelper,
    entityType: string,
    entityId: number,
    createdBy: number,
    fieldName: string
): Promise<string> {
    if (!text) return text;

    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let result = text;
    const matches = [...text.matchAll(imageRegex)];

    for (const match of matches) {
        const fullMatch = match[0];
        const imageUrl = match[2];

        const relativePath = extractMinioPath(imageUrl);
        if (!relativePath) continue;

        const media = await mediaHelper.migrateMedia(
            relativePath,
            entityType,
            entityId,
            createdBy,
            fieldName
        );

        if (media) {
            const replacement = `![media:${media.mediaId}](media:${media.mediaId})`;
            result = result.replace(fullMatch, replacement);
        }
    }

    return result;
}

function mapDifficulty(old: string | null): Difficulty | null {
    if (!old) return null;
    const map: Record<string, Difficulty> = {
        TH: Difficulty.TH,
        NB: Difficulty.NB,
        VD: Difficulty.VD,
        VDC: Difficulty.VDC,
    };
    return map[old] || null;
}

function mapQuestionType(old: string | null): QuestionType {
    const map: Record<string, QuestionType> = {
        TN: QuestionType.SINGLE_CHOICE,
        MULTIPLE: QuestionType.MULTIPLE_CHOICE,
        TLN: QuestionType.SHORT_ANSWER,
        ESSAY: QuestionType.ESSAY,
        DS: QuestionType.TRUE_FALSE,
    };
    return map[old || 'TN'] || QuestionType.SINGLE_CHOICE;
}

function mapTypeOfExam(old: string | null): TypeOfExam | null {
    if (!old) return null;
    const map: Record<string, TypeOfExam> = {
        CK1: TypeOfExam.CK1,
        CK2: TypeOfExam.CK2,
        GK1: TypeOfExam.GK1,
        GK2: TypeOfExam.GK2,
        TSA: TypeOfExam.TSA,
        THPT: TypeOfExam.THPT,
        OTTHPT: TypeOfExam.OTTHPT,
        OT: TypeOfExam.OT,
        HSA: TypeOfExam.HSA,
        OTHS: TypeOfExam.OTHS,
    };
    return map[old] || null;
}

/* -------------------------------------------------- */
/* ---------------- MIGRATE QUESTION ---------------- */
/* -------------------------------------------------- */

async function migrateQuestion(
    oldQuestion: any,
    mediaHelper: MediaMigrationHelper,
    createdBy: number,
    grade: number
): Promise<number | null> {
    const exists = await newDb.question.findUnique({
        where: { questionId: oldQuestion.id },
    });

    if (exists) return exists.questionId;
    const type = mapQuestionType(oldQuestion.typeOfQuestion);
    let pointOriginal = 0;
    if (type === QuestionType.MULTIPLE_CHOICE) {
        pointOriginal = 0.25;
    } else if (type === QuestionType.TRUE_FALSE) {
        pointOriginal = 1;
    } else if (type === QuestionType.SHORT_ANSWER) {
        pointOriginal = 0.5;
    }
    return await newDb.$transaction(async (tx) => {
        // 1️⃣ Create question trước
        const question = await tx.question.create({
            data: {
                questionId: oldQuestion.id,
                content: oldQuestion.content || '',
                slug:
                    'question-' + oldQuestion.id,
                type: type,
                pointsOrigin: pointOriginal,
                difficulty: mapDifficulty(oldQuestion.difficulty),
                solution: oldQuestion.solution || '',
                solutionYoutubeUrl: oldQuestion.solutionUrl,
                visibility: Visibility.PUBLISHED,
                createdBy,
                correctAnswer: oldQuestion.correctAnswer || null,
                subjectId: 1,
                grade,
            },
        });

        const chapter = await tx.chapter.findFirst({
            where: {
                subjectId: 1,
                code: oldQuestion.chapter,
            },
        });

        if (chapter) {
            await tx.questionChapter.create({
                data: {
                    questionId: question.questionId,
                    chapterId: chapter.chapterId,
                },
            });
        }

        // 2️⃣ Replace markdown images trong content
        let updatedContent = await replaceMarkdownImagesWithMedia(
            question.content,
            mediaHelper,
            EntityType.QUESTION,
            question.questionId,
            createdBy,
            QUESTION_CONTENT_FIELDS.CONTENT
        );

        // 3️⃣ Nếu có imageUrl riêng, upload và append vào cuối content
        if (oldQuestion.imageUrl) {
            try {
                const relativePath = extractMinioPath(oldQuestion.imageUrl);
                if (relativePath) {
                    const media = await mediaHelper.migrateMedia(
                        relativePath,
                        EntityType.QUESTION,
                        question.questionId,
                        createdBy,
                        QUESTION_CONTENT_FIELDS.CONTENT
                    );
                    if (media) {
                        const mediaMarkdown = '![media:' + media.mediaId + '](media:' + media.mediaId + ')';
                        updatedContent = updatedContent + '\n' + mediaMarkdown;
                    }
                }
            } catch (err: any) {
                console.warn('Failed to migrate question imageUrl: ' + err.message);
            }
        }

        // 4️⃣ Replace markdown images trong solution
        let updatedSolution = await replaceMarkdownImagesWithMedia(
            question.solution || '',
            mediaHelper,
            EntityType.QUESTION,
            question.questionId,
            createdBy,
            QUESTION_CONTENT_FIELDS.SOLUTION
        );

        // 5️⃣ Nếu có solutionImageUrl riêng, upload và append vào cuối solution
        if (oldQuestion.solutionImageUrl) {
            try {
                const relativePath = extractMinioPath(oldQuestion.solutionImageUrl);
                if (relativePath) {
                    const media = await mediaHelper.migrateMedia(
                        relativePath,
                        EntityType.QUESTION,
                        question.questionId,
                        createdBy,
                        QUESTION_CONTENT_FIELDS.SOLUTION
                    );
                    if (media) {
                        const mediaMarkdown = '![media:' + media.mediaId + '](media:' + media.mediaId + ')';
                        updatedSolution = updatedSolution + '\n' + mediaMarkdown;
                    }
                }
            } catch (err: any) {
                console.warn('Failed to migrate question solutionImageUrl: ' + err.message);
            }
        }

        await tx.question.update({
            where: { questionId: question.questionId },
            data: {
                content: updatedContent,
                solution: updatedSolution,
            },
        });

        // 3️⃣ Statements
        if (oldQuestion.statements?.length) {
            for (const oldStatement of oldQuestion.statements) {
                // Replace markdown images trong statement content
                let statementContent = await replaceMarkdownImagesWithMedia(
                    oldStatement.content || '',
                    mediaHelper,
                    EntityType.STATEMENT,
                    question.questionId,
                    createdBy,
                    STATEMENT_MEDIA_FIELDS.CONTENT
                );

                // Nếu statement có imageUrl riêng, upload và append vào cuối content
                if (oldStatement.imageUrl) {
                    try {
                        const relativePath = extractMinioPath(oldStatement.imageUrl);
                        if (relativePath) {
                            const media = await mediaHelper.migrateMedia(
                                relativePath,
                                EntityType.STATEMENT,
                                oldStatement.id,
                                createdBy,
                                STATEMENT_MEDIA_FIELDS.CONTENT
                            );
                            if (media) {
                                const mediaMarkdown = '![media:' + media.mediaId + '](media:' + media.mediaId + ')';
                                statementContent = statementContent + '\n' + mediaMarkdown;
                            }
                        }
                    } catch (err: any) {
                        console.warn('Failed to migrate statement imageUrl: ' + err.message);
                    }
                }

                await tx.statement.create({
                    data: {
                        statementId: oldStatement.id,
                        questionId: question.questionId,
                        content: statementContent,
                        isCorrect: oldStatement.isCorrect,
                        order: oldStatement.order || 0,
                        difficulty: mapDifficulty(oldStatement.difficulty),
                    },
                });
            }
        }

        return question.questionId;
    });
}

/* -------------------------------------------------- */
/* ------------------- MIGRATE EXAMS ---------------- */
/* -------------------------------------------------- */

export async function migrateExams() {
    console.log('🚀 Starting Exam migration...');

    const mediaHelper = new MediaMigrationHelper();
    await mediaHelper.initialize();

    const oldExams = await oldDb.oldExam.findMany({
        include: {
            examQuestions: {
                include: {
                    question: { include: { statements: true } },
                },
            },
        },
    });

    let examCount = 0;
    let questionCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const oldExam of oldExams) {
        try {
            const exists = await newDb.exam.findUnique({
                where: { examId: oldExam.id },
            });

            if (exists) {
                skipCount++;
                continue;
            }

            const grade = parseInt(oldExam.class || '10') || 10;
            const createdBy = 1;

            const exam = await newDb.exam.create({
                data: {
                    examId: oldExam.id,
                    title: oldExam.name,
                    description: oldExam.description,
                    grade,
                    subjectId: 1,
                    createdBy,
                    visibility: oldExam.isClassroomExam
                        ? ExamVisibility.PRIVATE
                        : ExamVisibility.PUBLISHED,
                    solutionYoutubeUrl: oldExam.solutionUrl,
                    typeOfExam: mapTypeOfExam(oldExam.typeOfExam),
                },
            });

            examCount++;

            const questionIds: number[] = [];

            for (const eq of oldExam.examQuestions || []) {
                const qId = await migrateQuestion(
                    eq.question,
                    mediaHelper,
                    createdBy,
                    grade
                );
                if (qId) {
                    questionIds.push(qId);
                    questionCount++;
                }
            }

            const sectionTN = await newDb.section.create({
                data: {
                    examId: exam.examId,
                    title: 'Phần 1: Trắc nghiệm',
                    order: 1,
                },
            });

            const sectionDS = await newDb.section.create({
                data: {
                    examId: exam.examId,
                    title: 'Phần 2: Đúng sai',
                    order: 2,
                },
            });

            const sectionTLN = await newDb.section.create({
                data: {
                    examId: exam.examId,
                    title: 'Phần 3: Trả lời ngắn',
                    order: 3,
                },
            });


            let order = 0;

            for (const qId of questionIds) {
                order++;
                const question = await newDb.question.findUnique({
                    where: { questionId: qId },
                });

                let sectionId: number | null = null;
                let point = 0;
                if (question?.type === QuestionType.TRUE_FALSE) {
                    sectionId = sectionDS.sectionId;
                    point = 1;
                } else if (question?.type === QuestionType.SHORT_ANSWER) {
                    sectionId = sectionTLN.sectionId;
                    point = 0.5;
                } else if (question?.type === QuestionType.SINGLE_CHOICE) {
                    sectionId = sectionTN.sectionId;
                    point = 0.25;
                }

                await newDb.questionExam.create({
                    data: {
                        questionId: qId,
                        examId: exam.examId,
                        sectionId,
                        order,
                        points: point,
                    },
                });
            }

            await newDb.competition.create({
                data: {
                    examId: exam.examId,
                    title: oldExam.name,
                    durationMinutes: oldExam.testDuration || 90,
                    maxAttempts: oldExam.attemptLimit || 1,
                    createdBy,
                    startDate: null,
                    endDate: null,
                    visibility: Visibility.PRIVATE,
                    enableAntiCheating:
                        oldExam.isCheatingCheckEnabled || false,
                    showResultDetail:
                        oldExam.seeCorrectAnswer ?? true,
                    allowViewAnswer:
                        oldExam.seeCorrectAnswer ?? false,
                },
            });

            console.log(
                `✅ Migrated exam "${oldExam.name}" (${questionIds.length} questions)`
            );
        } catch (error: any) {
            errorCount++;
            console.error(`❌ Error migrating exam ${oldExam.name}:`, error.message);
        }
    }

    // 🔥 Reset AUTO_INCREMENT sau khi migrate tất cả
    try {
        await newDb.$executeRawUnsafe(`
            ALTER TABLE questions
            AUTO_INCREMENT = (SELECT COALESCE(MAX(question_id), 0)+1 FROM questions);
        `);

        await newDb.$executeRawUnsafe(`
            ALTER TABLE exams AUTO_INCREMENT = (SELECT COALESCE(MAX(exam_id), 0)+1 FROM exams);
        `);

        await newDb.$executeRawUnsafe(`
            ALTER TABLE statements AUTO_INCREMENT = (SELECT COALESCE(MAX(statement_id), 0)+1 FROM statements);
        `);

        await newDb.$executeRawUnsafe(`
            ALTER TABLE sections AUTO_INCREMENT = (SELECT COALESCE(MAX(section_id), 0)+1 FROM sections);
        `);
    } catch (error: any) {
        console.warn('⚠️  Failed to reset AUTO_INCREMENT:', error.message);
    }

    const successCount = examCount;

    console.log('\n✨ Migration completed');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total: ${oldExams.length}`);
    console.log(`  📝 Questions: ${questionCount}`);

    return { successCount, skipCount, errorCount, total: oldExams.length };
}

/* -------------------------------------------------- */

if (require.main === module) {
    const { connectDatabases, disconnectDatabases } = require('./db-clients');

    connectDatabases()
        .then(() => migrateExams())
        .then(async () => {
            await disconnectDatabases();
        })
        .catch(async (err) => {
            console.error(err);
            await disconnectDatabases();
            process.exit(1);
        });
}