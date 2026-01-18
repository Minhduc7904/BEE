// prisma/seeds/seed-user-roles.ts
import { PrismaClient } from '@prisma/client'
import { ROLE_IDS } from '../../src/shared/constants'

export async function seedUserRoles(
    prisma: PrismaClient,
    users: {
        superAdminUser: { userId: number }
        adminUser: { userId: number }
    },
) {
    console.log('🎭 Seeding user roles...')

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: users.superAdminUser.userId,
                roleId: ROLE_IDS.SUPER_ADMIN,
            },
        },
        update: {},
        create: {
            userId: users.superAdminUser.userId,
            roleId: ROLE_IDS.SUPER_ADMIN,
            assignedBy: null,
            expiresAt: null,
        },
    })

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: users.adminUser.userId,
                roleId: ROLE_IDS.ADMIN,
            },
        },
        update: {},
        create: {
            userId: users.adminUser.userId,
            roleId: ROLE_IDS.ADMIN,
            assignedBy: users.superAdminUser.userId,
            expiresAt: null,
        },
    })
}
