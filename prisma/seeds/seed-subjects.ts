// prisma/seeds/seed-subjects.ts
import { PrismaClient } from '@prisma/client'
import { SUBJECTS } from '../../src/shared/constants'

export async function seedSubjects(prisma: PrismaClient) {
    console.log('📚 Seeding subjects...')

    let created = 0
    let updated = 0

    for (const subject of SUBJECTS) {
        try {
            const existingSubject = await prisma.subject.findUnique({
                where: { code: subject.code },
            })

            if (existingSubject) {
                await prisma.subject.update({
                    where: { code: subject.code },
                    data: {
                        name: subject.name,
                    },
                })
                updated++
            } else {
                await prisma.subject.create({
                    data: {
                        subjectId: subject.id,
                        name: subject.name,
                        code: subject.code,
                    },
                })
                created++
            }
        } catch (error) {
            console.error(`❌ Failed to seed subject: ${subject.name}`, error)
        }
    }

    console.log(`✅ Subjects: ${created} created, ${updated} updated (Total: ${SUBJECTS.length})`)
}
