import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import { seedRoles } from './seeds/seed-roles'
import { seedPermissions } from './seeds/seed-permissions'
import { seedRolePermissions } from './seeds/seed-role-permissions'
import { seedSubjects } from './seeds/seed-subjects'
import { seedChapters } from './seeds/seed-chapters'
import { seedUsers } from './seeds/seed-users'
import { seedUserRoles } from './seeds/seed-user-roles'
import { seedDevParentAuthStudent } from './seeds/seed-dev-parent-auth-student'
import { seedDevAcademicData } from './seeds/seed-dev-academic-data'

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Dev seed bị từ chối: NODE_ENV phải có giá trị development.')
  }

  const prisma = new PrismaClient()
  try {
    console.log('🌱 [DEV] Seeding nền tảng (roles, permissions, subjects, chapters)...')
    await seedRoles(prisma)
    await seedPermissions(prisma)
    await seedRolePermissions(prisma)
    await seedSubjects(prisma)
    await seedChapters(prisma)

    console.log('🌱 [DEV] Seeding admin/teacher accounts...')
    const users = await seedUsers(prisma)
    await seedUserRoles(prisma, users)

    const teacherAdmins = await Promise.all(
      [users.thayBee, users.thayPhu, users.coGiang, users.thayMinh].map((user) =>
        prisma.admin.findUniqueOrThrow({ where: { userId: user.userId } }),
      ),
    )

    console.log('🌱 [DEV] Seeding Parent + 4 Student (Parent Auth recovery)...')
    const parentFixture = await seedDevParentAuthStudent(prisma)

    await seedDevAcademicData(
      prisma,
      parentFixture,
      teacherAdmins.map((admin) => admin.adminId),
    )

    console.log('🎉 [DEV] Seed hoàn tất.')
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error: unknown) => {
  console.error('❌ [DEV] Seed thất bại:', error)
  process.exit(1)
})
