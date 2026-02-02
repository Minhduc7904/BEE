// src/shared/constants/resource-type.constants.ts

export const RESOURCE_TYPES = {
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  USER_ROLE: 'USER_ROLE',
  USER: 'USER',
  SUBJECT: 'SUBJECT',
  CHAPTER: 'CHAPTER',
  DOCUMENT: 'DOCUMENT',
  QUESTION_IMAGE: 'QUESTION_IMAGE',
  SOLUTION_IMAGE: 'SOLUTION_IMAGE',
  MEDIA_IMAGE: 'MEDIA_IMAGE',
  IMAGE: 'IMAGE',
  ATTENDANCE: 'ATTENDANCE',
  CLASS_SESSION: 'CLASS_SESSION',
  CLASS_STUDENT: 'CLASS_STUDENT',
  COURSE: 'COURSE',
  COURSE_CLASS: 'COURSE_CLASS',
  COURSE_ENROLLMENT: 'COURSE_ENROLLMENT',
  LEARNING_ITEM: 'LEARNING_ITEM',
  DOCUMENT_CONTENT: 'DOCUMENT_CONTENT',
  HOMEWORK_CONTENT: 'HOMEWORK_CONTENT',
  HOMEWORK_SUBMIT: 'HOMEWORK_SUBMIT',
  VIDEO_CONTENT: 'VIDEO_CONTENT',
  YOUTUBE_CONTENT: 'YOUTUBE_CONTENT',
  NOTIFICATION: 'NOTIFICATION',
  TUITION_PAYMENT: 'TUITION_PAYMENT',
  EXAM_IMPORT_SESSION: 'EXAM_IMPORT_SESSION',
} as const

export const RESOURCE_TYPE_TABLE = {
  [RESOURCE_TYPES.ROLE]: {
    displayName: 'Role',
    tableName: 'roles',
    primaryKey: 'roleId',
    repositoryName: 'roleRepository',
  },
  [RESOURCE_TYPES.PERMISSION]: {
    displayName: 'Permission',
    tableName: 'permissions',
    primaryKey: 'permissionId',
    repositoryName: 'permissionRepository',
  },
  [RESOURCE_TYPES.USER_ROLE]: {
    displayName: 'User Role',
    tableName: 'user_roles',
    primaryKey: 'userId,roleId',
    repositoryName: 'roleRepository',
  },
  [RESOURCE_TYPES.USER]: {
    displayName: 'User',
    tableName: 'users',
    primaryKey: 'userId',
    repositoryName: 'userRepository',
  },
  [RESOURCE_TYPES.SUBJECT]: {
    displayName: 'Subject',
    tableName: 'subjects',
    primaryKey: 'subjectId',
    repositoryName: 'subjectRepository',
  },
  [RESOURCE_TYPES.CHAPTER]: {
    displayName: 'Chapter',
    tableName: 'chapters',
    primaryKey: 'chapterId',
    repositoryName: 'chapterRepository',
  },
  [RESOURCE_TYPES.DOCUMENT]: {
    displayName: 'Document',
    tableName: 'documents',
    primaryKey: 'documentId',
    repositoryName: 'documentRepository',
  },
  [RESOURCE_TYPES.QUESTION_IMAGE]: {
    displayName: 'Question Image',
    tableName: 'question_images',
    primaryKey: 'imageId',
    repositoryName: 'questionImageRepository',
  },
  [RESOURCE_TYPES.SOLUTION_IMAGE]: {
    displayName: 'Solution Image',
    tableName: 'solution_images',
    primaryKey: 'imageId',
    repositoryName: 'solutionImageRepository',
  },
  [RESOURCE_TYPES.MEDIA_IMAGE]: {
    displayName: 'Media Image',
    tableName: 'media_images',
    primaryKey: 'imageId',
    repositoryName: 'mediaImageRepository',
  },
  [RESOURCE_TYPES.IMAGE]: {
    displayName: 'Image',
    tableName: 'images',
    primaryKey: 'imageId',
    repositoryName: 'imageRepository',
  },
  [RESOURCE_TYPES.ATTENDANCE]: {
    displayName: 'Attendance',
    tableName: 'attendance',
    primaryKey: 'attendanceId',
    repositoryName: 'attendanceRepository',
  },
  [RESOURCE_TYPES.CLASS_SESSION]: {
    displayName: 'Class Session',
    tableName: 'class_sessions',
    primaryKey: 'sessionId',
    repositoryName: 'classSessionRepository',
  },
  [RESOURCE_TYPES.CLASS_STUDENT]: {
    displayName: 'Class Student',
    tableName: 'class_students',
    primaryKey: 'classId,studentId',
    repositoryName: 'classStudentRepository',
  },
  [RESOURCE_TYPES.COURSE]: {
    displayName: 'Course',
    tableName: 'courses',
    primaryKey: 'courseId',
    repositoryName: 'courseRepository',
  },
  [RESOURCE_TYPES.COURSE_CLASS]: {
    displayName: 'Course Class',
    tableName: 'course_classes',
    primaryKey: 'classId',
    repositoryName: 'courseClassRepository',
  },
  [RESOURCE_TYPES.COURSE_ENROLLMENT]: {
    displayName: 'Course Enrollment',
    tableName: 'course_enrollments',
    primaryKey: 'enrollmentId',
    repositoryName: 'courseEnrollmentRepository',
  },
  [RESOURCE_TYPES.LEARNING_ITEM]: {
    displayName: 'Learning Item',
    tableName: 'learning_items',
    primaryKey: 'learningItemId',
    repositoryName: 'learningItemRepository',
  },
  [RESOURCE_TYPES.DOCUMENT_CONTENT]: {
    displayName: 'Document Content',
    tableName: 'document_contents',
    primaryKey: 'documentContentId',
    repositoryName: 'documentContentRepository',
  },
  [RESOURCE_TYPES.HOMEWORK_CONTENT]: {
    displayName: 'Homework Content',
    tableName: 'homework_contents',
    primaryKey: 'homeworkContentId',
    repositoryName: 'homeworkContentRepository',
  },
  [RESOURCE_TYPES.HOMEWORK_SUBMIT]: {
    displayName: 'Homework Submit',
    tableName: 'homework_submits',
    primaryKey: 'homeworkSubmitId',
    repositoryName: 'homeworkSubmitRepository',
  },
  [RESOURCE_TYPES.VIDEO_CONTENT]: {
    displayName: 'Video Content',
    tableName: 'video_contents',
    primaryKey: 'videoContentId',
    repositoryName: 'videoContentRepository',
  },
  [RESOURCE_TYPES.YOUTUBE_CONTENT]: {
    displayName: 'Youtube Content',
    tableName: 'youtube_contents',
    primaryKey: 'youtubeContentId',
    repositoryName: 'youtubeContentRepository',
  },
  [RESOURCE_TYPES.NOTIFICATION]: {
    displayName: 'Notification',
    tableName: 'notifications',
    primaryKey: 'notificationId',
    repositoryName: 'notificationRepository',
  },
  [RESOURCE_TYPES.TUITION_PAYMENT]: {
    displayName: 'Tuition Payment',
    tableName: 'tuition_payments',
    primaryKey: 'tuitionPaymentId',
    repositoryName: 'tuitionPaymentRepository',
  },
  [RESOURCE_TYPES.EXAM_IMPORT_SESSION]: {
    displayName: 'Exam Import Session',
    tableName: 'exam_import_sessions',
    primaryKey: 'sessionId',
    repositoryName: 'examImportSessionRepository',
  },
} as const

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES]

export type ResourceInfo = {
  displayName: string
  tableName: string
  primaryKey: string
  repositoryName: string
}

// Helper functions để tra cứu thông tin
export const getResourceInfo = (resourceType: ResourceType): ResourceInfo => {
  return RESOURCE_TYPE_TABLE[resourceType]
}

export const getTableName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].tableName
}

export const getRepositoryName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].repositoryName
}

export const getPrimaryKey = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].primaryKey
}

export const getDisplayName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].displayName
}
