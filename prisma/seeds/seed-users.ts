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

    const thayBee = await prisma.user.upsert({
        where: { username: 'thaybee' },
        update: {},
        create: {
            username: 'thaybee',
            passwordHash: hashedPassword,
            firstName: 'Thầy',
            lastName: 'Ngọc',
        },
    })

    const thayPhu = await prisma.user.upsert({
        where: { username: 'thayphu' },
        update: {},
        create: {
            username: 'thayphu',
            passwordHash: hashedPassword,
            firstName: 'Thầy',
            lastName: 'Phú',
        },
    })

    const coGiang = await prisma.user.upsert({
        where: { username: 'cogiang' },
        update: {},
        create: {
            username: 'cogiang',
            passwordHash: hashedPassword,
            firstName: 'Cô',
            lastName: 'Giang',
        },
    })

    const thayMinh = await prisma.user.upsert({
        where: { username: 'thayminh' },
        update: {},
        create: {
            username: 'thayminh',
            passwordHash: hashedPassword,
            firstName: 'Thầy',
            lastName: 'Minh',
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

    await prisma.admin.upsert({
        where: { userId: thayBee.userId },
        update: {},
        create: { userId: thayBee.userId, subjectId: 1 },
    })

    await prisma.admin.upsert({
        where: { userId: thayPhu.userId },
        update: {},
        create: { userId: thayPhu.userId, subjectId: 1 },
    })

    await prisma.admin.upsert({
        where: { userId: coGiang.userId },
        update: {},
        create: { userId: coGiang.userId, subjectId: 1 },
    })

    await prisma.admin.upsert({
        where: { userId: thayMinh.userId },
        update: {},
        create: { userId: thayMinh.userId, subjectId: 1 },
    })



    return { superAdminUser, adminUser, thayBee, thayPhu, coGiang, thayMinh }
}
