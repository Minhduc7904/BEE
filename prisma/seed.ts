// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { seedRoles } from './seeds/seed-roles'
import { seedPermissions } from './seeds/seed-permissions'
import { seedUsers } from './seeds/seed-users'
import { seedUserRoles } from './seeds/seed-user-roles'
import { seedSubjects } from './seeds/seed-subjects'
import { seedChapters } from './seeds/seed-chapters'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    await seedRoles(prisma)
    await seedPermissions(prisma)

    const users = await seedUsers(prisma)
    await seedUserRoles(prisma, users)

    await seedSubjects(prisma)
    await seedChapters(prisma)

    console.log('🎉 Seed completed successfully')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
