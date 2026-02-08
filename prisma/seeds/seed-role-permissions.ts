// prisma/seeds/seed-role-permissions.ts
import { PrismaClient } from '@prisma/client'
import { PERMISSION_CODES, ROLE_NAMES } from '../../src/shared/constants'

type RolePermissionMap = Record<string, string[]>

/**
 * ================================
 * ROLE → PERMISSIONS MAPPING
 * ================================
 */
const ROLE_PERMISSIONS: RolePermissionMap = {
  [ROLE_NAMES.BASIC_ADMIN]: [
    // PAGE ACCESS
    PERMISSION_CODES.ADMIN_PAGE.DASHBOARD,
    PERMISSION_CODES.ADMIN_PAGE.MY_COURSES,
    PERMISSION_CODES.ADMIN_PAGE.MY_CLASSES,
    PERMISSION_CODES.ADMIN_PAGE.MY_QUESTIONS,
    PERMISSION_CODES.ADMIN_PAGE.MY_EXAMS,
    PERMISSION_CODES.ADMIN_PAGE.MEDIA_FOLDERS,
    PERMISSION_CODES.ADMIN_PAGE.STUDENTS,
    PERMISSION_CODES.ADMIN_PAGE.STUDENT_DETAIL,

    // MEDIA
    PERMISSION_CODES.MEDIA.UPLOAD,
    PERMISSION_CODES.MEDIA.GET_MY_MEDIA,
    PERMISSION_CODES.MEDIA.GET_BY_ID,
    PERMISSION_CODES.MEDIA.UPDATE,
    PERMISSION_CODES.MEDIA.VIEW_MY,
    PERMISSION_CODES.MEDIA.DOWNLOAD_MY,
    PERMISSION_CODES.MEDIA.DELETE_MY,

    PERMISSION_CODES.MEDIA_FOLDER.CREATE,
    PERMISSION_CODES.MEDIA_FOLDER.VIEW,
    PERMISSION_CODES.MEDIA_FOLDER.UPDATE,
    PERMISSION_CODES.MEDIA_FOLDER.DELETE,

    PERMISSION_CODES.MEDIA_USAGE.ATTACH,
    PERMISSION_CODES.MEDIA_USAGE.GET_BY_MEDIA,
    PERMISSION_CODES.MEDIA_USAGE.GET_BY_ENTITY,
    PERMISSION_CODES.MEDIA_USAGE.DETACH,

    // NOTIFICATION
    PERMISSION_CODES.NOTIFICATION.GET_MY,
    PERMISSION_CODES.NOTIFICATION.MARK_READ,
  ],

  [ROLE_NAMES.NOTIFICATION_SENDER]: [
    PERMISSION_CODES.NOTIFICATION.SEND,
    PERMISSION_CODES.ADMIN_PAGE.BROADCAST_NOTIFICATIONS,
  ],

  [ROLE_NAMES.ADMIN_MANAGER]: [
    PERMISSION_CODES.ADMIN.GET_ALL,
    PERMISSION_CODES.ADMIN.GET_BY_ID,
    PERMISSION_CODES.ADMIN.CREATE,

    PERMISSION_CODES.ADMIN.SEARCH,
    PERMISSION_CODES.AUDIT_LOG.GET_ALL,
    PERMISSION_CODES.AUDIT_LOG.GET_BY_ID,
    PERMISSION_CODES.AUDIT_LOG.GET_ALL_BY_ADMIN,

    PERMISSION_CODES.ADMIN_PAGE.ADMINS,
    PERMISSION_CODES.ADMIN_PAGE.ADMIN_DETAIL,
    PERMISSION_CODES.ADMIN_PAGE.AUDIT_LOGS,
  ],

  [ROLE_NAMES.STUDENT_MANAGER]: [
    PERMISSION_CODES.STUDENT.GET_ALL,
    PERMISSION_CODES.STUDENT.GET_BY_ID,
    PERMISSION_CODES.STUDENT.CREATE,
    PERMISSION_CODES.STUDENT.UPDATE,
    PERMISSION_CODES.STUDENT.EXPORT_EXCEL,

    PERMISSION_CODES.STUDENT.SEARCH,
    
    PERMISSION_CODES.ADMIN_PAGE.STUDENTS,
    PERMISSION_CODES.ADMIN_PAGE.STUDENT_DETAIL,
  ],

  [ROLE_NAMES.USER_MODERATOR]: [
    // USER MODERATION - Vô hiệu hóa/Kích hoạt người dùng
    PERMISSION_CODES.USER.TOGGLE_ACTIVATION, // Quyền chính: vô hiệu hóa user
  ],

  [ROLE_NAMES.ROLE_MANAGER]: [
    // ROLE MANAGEMENT - Quản lý roles
    PERMISSION_CODES.ROLE.GET_ALL,
    PERMISSION_CODES.ROLE.GET_BY_ID,
    PERMISSION_CODES.ROLE.CREATE,
    PERMISSION_CODES.ROLE.UPDATE,
    PERMISSION_CODES.ROLE.DELETE,
    PERMISSION_CODES.ROLE.ASSIGN, // Gán role cho user
    PERMISSION_CODES.ROLE.REMOVE_FROM_USER, // Gỡ role khỏi user
    PERMISSION_CODES.ROLE.GET_USER_ROLES, // Lấy roles của user
    PERMISSION_CODES.ROLE.TOGGLE_ROLE_PERMISSION,

    // PAGE ACCESS
    PERMISSION_CODES.ADMIN_PAGE.ROLES, // Trang quản lý roles
  ],

  [ROLE_NAMES.PERMISSION_MANAGER]: [
    // PERMISSION MANAGEMENT - Quản lý permissions
    PERMISSION_CODES.PERMISSION.GET_ALL,
    PERMISSION_CODES.PERMISSION.GET_BY_ID,
    PERMISSION_CODES.PERMISSION.CREATE,
    PERMISSION_CODES.PERMISSION.UPDATE,
    PERMISSION_CODES.PERMISSION.DELETE,
    PERMISSION_CODES.PERMISSION.GET_GROUPS,


    // PAGE ACCESS
    PERMISSION_CODES.ADMIN_PAGE.PERMISSIONS, // Trang quản lý permissions
  ],
}

/**
 * ================================
 * SEED FUNCTION
 * ================================
 */
export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('🔗 Seeding role permissions...')

  for (const [roleName, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { roleName } })

    if (!role) {
      console.log(`⚠️  Role not found: ${roleName}, skipping`)
      continue
    }

    let created = 0
    let skipped = 0

    for (const code of permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code },
      })

      if (!permission) {
        console.log(`⚠️  Permission not found: ${code}`)
        skipped++
        continue
      }

      const exists = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.roleId,
            permissionId: permission.permissionId,
          },
        },
      })

      if (exists) {
        skipped++
        continue
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.roleId,
          permissionId: permission.permissionId,
        },
      })

      created++
    }

    console.log(
      `✅ ${roleName}: ${created} created, ${skipped} skipped (Total: ${permissionCodes.length})`,
    )
  }
}
