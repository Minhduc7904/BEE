// src/shared/enums/course-visibility.enum.ts

/**
 * Course Visibility Enum
 * Đồng bộ với Prisma schema enum CourseVisibility
 */
export enum CourseVisibility {
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE',
  PUBLISHED = 'PUBLISHED',
}

/**
 * Course Visibility Labels
 */
export const CourseVisibilityLabels: Record<CourseVisibility, string> = {
  [CourseVisibility.DRAFT]: 'Bản nháp',
  [CourseVisibility.PRIVATE]: 'Riêng tư',
  [CourseVisibility.PUBLISHED]: 'Công khai',
};

/**
 * Course Visibility Descriptions
 */
export const CourseVisibilityDescriptions: Record<CourseVisibility, string> = {
  [CourseVisibility.DRAFT]: 'Khóa học đang trong quá trình phát triển',
  [CourseVisibility.PRIVATE]: 'Chỉ admin và giảng viên có thể xem',
  [CourseVisibility.PUBLISHED]: 'Tất cả học sinh có thể đăng ký',
};
