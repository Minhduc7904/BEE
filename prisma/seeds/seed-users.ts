// prisma/seeds/seed-users.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export async function seedUsers(prisma: PrismaClient) {
    console.log('👤 Seeding users...')

    const hashedPassword = await bcrypt.hash('070904', 10)

    const superAdminUser = await prisma.user.upsert({
        where: { username: 'minhduc7904' },
        update: {},
        create: {
            username: 'minhduc7904',
            email: 'nmduc7904@gmail.com',
            passwordHash: hashedPassword,
            firstName: 'Đức',
            lastName: 'Nguyễn Minh',
        },
    })

    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@bee.edu.vn',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
        },
    })

    await prisma.admin.upsert({
        where: { userId: superAdminUser.userId },
        update: {},
        create: { userId: superAdminUser.userId },
    })

    await prisma.admin.upsert({
        where: { userId: adminUser.userId },
        update: {},
        create: { userId: adminUser.userId },
    })

    return { superAdminUser, adminUser }
}
