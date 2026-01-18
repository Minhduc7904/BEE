// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { seedRoles } from './seeds/seed-roles'
import { seedPermissions } from './seeds/seed-permissions'
import { seedUsers } from './seeds/seed-users'
import { seedUserRoles } from './seeds/seed-user-roles'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    await seedRoles(prisma)
    await seedPermissions(prisma)

    const users = await seedUsers(prisma)
    await seedUserRoles(prisma, users)

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
