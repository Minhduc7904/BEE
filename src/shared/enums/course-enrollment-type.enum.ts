/**
 * Đồng bộ với Prisma enum CourseEnrollmentType.
 * MANUAL là enrollment do admin/luồng hiện hữu tạo; ONLINE_PURCHASE là do học sinh mua course.
 */
export enum CourseEnrollmentType {
  MANUAL = 'MANUAL',
  ONLINE_PURCHASE = 'ONLINE_PURCHASE',
}

export const CourseEnrollmentTypeLabels: Record<CourseEnrollmentType, string> = {
  [CourseEnrollmentType.MANUAL]: 'Thủ công',
  [CourseEnrollmentType.ONLINE_PURCHASE]: 'Mua course online',
}
