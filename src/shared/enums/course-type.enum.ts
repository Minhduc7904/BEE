// src/shared/enums/course-type.enum.ts

/**
 * Course Type Enum
 * Dong bo voi Prisma schema enum CourseType
 */
export enum CourseType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ALL = 'ALL',
}

export const CourseTypeLabels: Record<CourseType, string> = {
  [CourseType.ONLINE]: 'Online',
  [CourseType.OFFLINE]: 'Offline',
  [CourseType.ALL]: 'Online va offline',
}

export const CourseTypeDescriptions: Record<CourseType, string> = {
  [CourseType.ONLINE]: 'Khoa hoc chi hoc online',
  [CourseType.OFFLINE]: 'Khoa hoc chi hoc offline',
  [CourseType.ALL]: 'Khoa hoc ho tro ca online va offline',
}
