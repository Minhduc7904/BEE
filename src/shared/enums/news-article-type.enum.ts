/**
 * Dong bo voi Prisma schema enum NewsArticleType.
 */
export enum NewsArticleType {
  NEWS = 'NEWS',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  GUIDE = 'GUIDE',
  EVENT = 'EVENT',
  LEARNING = 'LEARNING',
  COURSE_MEMORY = 'COURSE_MEMORY',
}

export const NewsArticleTypeLabels: Record<NewsArticleType, string> = {
  [NewsArticleType.NEWS]: 'Tin tuc',
  [NewsArticleType.ANNOUNCEMENT]: 'Thong bao',
  [NewsArticleType.GUIDE]: 'Huong dan',
  [NewsArticleType.EVENT]: 'Su kien',
  [NewsArticleType.LEARNING]: 'Bai viet hoc tap',
  [NewsArticleType.COURSE_MEMORY]: 'Ky niem khoa hoc cu',
}
