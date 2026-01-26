// prisma/seeds/seed-permissions.ts
import { PrismaClient } from '@prisma/client'
import { PERMISSIONS } from '../../src/shared/constants'

export async function seedPermissions(prisma: PrismaClient) {
    console.log('🔐 Seeding permissions...')

    let created = 0
    let updated = 0

    for (const permission of PERMISSIONS) {
        const existing = await prisma.permission.findUnique({
            where: { code: permission.code },
        })

        if (existing) {
            await prisma.permission.update({
                where: { code: permission.code },
                data: {
                    name: permission.name,
                    description: permission.description,
                    group: permission.group,
                    isSystem: permission.isSystem,
                },
            })
            updated++
        } else {
            await prisma.permission.create({
                data: {
                    code: permission.code,
                    name: permission.name,
                    description: permission.description,
                    group: permission.group,
                    isSystem: permission.isSystem,
                },
            })
            created++
        }
    }

    console.log(`✅ Permissions: ${created} created, ${updated} updated`)
}
