// prisma/seeds/seed-chapters.ts
import { PrismaClient } from '@prisma/client'
import { CHAPTERS } from '../../src/shared/constants'

export async function seedChapters(prisma: PrismaClient) {
    console.log('📖 Seeding chapters...')

    let created = 0
    let updated = 0

    // Sort chapters by level to ensure parent chapters are created first
    const sortedChapters = [...CHAPTERS].sort((a, b) => a.level - b.level)

    for (const chapter of sortedChapters) {
        try {
            const existingChapter = await prisma.chapter.findUnique({
                where: { code: chapter.code },
            })

            if (existingChapter) {
                await prisma.chapter.update({
                    where: { code: chapter.code },
                    data: {
                        name: chapter.name,
                        slug: chapter.slug,
                        subjectId: chapter.subjectId,
                        parentChapterId: chapter.parentChapterId,
                        orderInParent: chapter.orderInParent,
                        level: chapter.level,
                    },
                })
                updated++
            } else {
                await prisma.chapter.create({
                    data: {
                        chapterId: chapter.id,
                        subjectId: chapter.subjectId,
                        code: chapter.code,
                        name: chapter.name,
                        slug: chapter.slug,
                        parentChapterId: chapter.parentChapterId,
                        orderInParent: chapter.orderInParent,
                        level: chapter.level,
                    },
                })
                created++
            }
        } catch (error) {
            console.error(`❌ Failed to seed chapter: ${chapter.name}`, error)
        }
    }

    console.log(`✅ Chapters: ${created} created, ${updated} updated (Total: ${CHAPTERS.length})`)
}
