// src/shared/constants/roles.constant.ts

export const ROLES = [
  {
    id: 1,
    name: 'SUPER_ADMIN',
    description: 'Người dùng có quyền cao nhất, có thể quản lý toàn bộ hệ thống',
    isAssignable: false,
  },
  {
    id: 2,
    name: 'ADMIN',
    description: 'Người dùng có quyền quản trị hệ thống, có thể quản lý người dùng và nội dung',
    isAssignable: true,
  },
  {
    id: 3,
    name: 'TEACHER',
    description: 'Giáo viên, có thể tạo và quản lý các khóa học và lớp học',
    isAssignable: true,
  },
  {
    id: 4,
    name: 'STUDENT',
    description: 'Học sinh, có thể đăng ký và tham gia các khóa học',
    isAssignable: true,
  },
  {
    id: 5,
    name: 'ASSISTANT',
    description: 'Trợ giảng, hỗ trợ giáo viên trong việc quản lý lớp học và học sinh',
    isAssignable: true,
  },
]


/**
 * Role constants để sử dụng trong decorators và guards
 */
export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  ASSISTANT: 'ASSISTANT',
} as const

/**
 * Role IDs từ database
 */
export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  TEACHER: 3,
  STUDENT: 4,
  ASSISTANT: 5,
} as const

/**
 * Roles có quyền cao nhất (bypass tất cả permissions)
 */
export const SUPER_ROLES = [ROLE_NAMES.SUPER_ADMIN] as const

/**
 * Roles quản trị
 */
export const ADMIN_ROLES = [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.ADMIN] as const

/**
 * Roles có thể tạo/sửa nội dung
 */
export const CONTENT_CREATOR_ROLES = [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.ADMIN, ROLE_NAMES.TEACHER] as const

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES]
export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]
