export const COURSE_MEDIA_FIELDS = {
  THUMBNAIL: 'thumbnail',
  BANNER: 'banner',
  INTRO_VIDEO: 'introVideo',
  GALLERY: 'gallery',
} as const

export type CourseMediaField = typeof COURSE_MEDIA_FIELDS[keyof typeof COURSE_MEDIA_FIELDS]

export const COURSE_SINGLE_MEDIA_FIELDS = [
  COURSE_MEDIA_FIELDS.THUMBNAIL,
  COURSE_MEDIA_FIELDS.BANNER,
  COURSE_MEDIA_FIELDS.INTRO_VIDEO,
] as const

