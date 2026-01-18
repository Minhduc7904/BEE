// prisma/seeds/seed-roles.ts
import { PrismaClient } from '@prisma/client'
import { ROLES } from '../../src/shared/constants'

export async function seedRoles(prisma: PrismaClient) {
    console.log('📝 Seeding roles...')

    let created = 0
    let updated = 0

    for (const role of ROLES) {
        try {
            const existingRole = await prisma.role.findUnique({
                where: { roleName: role.name },
            })

            if (existingRole) {
                await prisma.role.update({
                    where: { roleName: role.name },
                    data: {
                        description: role.description,
                        isAssignable: role.isAssignable,
                    },
                })
                updated++
            } else {
                await prisma.role.create({
                    data: {
                        roleId: role.id,
                        roleName: role.name,
                        description: role.description,
                        isAssignable: role.isAssignable,
                    },
                })
                created++
            }
        } catch (error) {
            console.error(`❌ Failed to seed role: ${role.name}`, error)
        }
    }

    console.log(`✅ Roles: ${created} created, ${updated} updated (Total: ${ROLES.length})`)
}
