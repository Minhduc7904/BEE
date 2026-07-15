import { LearningItemType } from '../../../shared/enums'

export class StudentLearnedLearningItemResponseDto {
  studentId: number
  learningItemId: number
  isLearned: boolean
  learnedAt?: Date
  createdAt: Date
  updatedAt: Date
  learningItem: {
    learningItemId: number
    type: LearningItemType
    title: string
    description?: string
    createdAt: Date
    updatedAt: Date
  }
  lessons: Array<{
    lessonId: number
    lessonTitle: string
    courseId: number
    courseCode: string
    courseTitle: string
    order?: number
  }>

  static fromPrisma(studentLearningItem: any): StudentLearnedLearningItemResponseDto {
    return {
      studentId: studentLearningItem.studentId,
      learningItemId: studentLearningItem.learningItemId,
      isLearned: studentLearningItem.isLearned,
      learnedAt: studentLearningItem.learnedAt ?? undefined,
      createdAt: studentLearningItem.createdAt,
      updatedAt: studentLearningItem.updatedAt,
      learningItem: {
        learningItemId: studentLearningItem.learningItem.learningItemId,
        type: studentLearningItem.learningItem.type,
        title: studentLearningItem.learningItem.title,
        description: studentLearningItem.learningItem.description ?? undefined,
        createdAt: studentLearningItem.learningItem.createdAt,
        updatedAt: studentLearningItem.learningItem.updatedAt,
      },
      lessons: studentLearningItem.learningItem.lessons.map((lessonLearningItem: any) => ({
        lessonId: lessonLearningItem.lesson.lessonId,
        lessonTitle: lessonLearningItem.lesson.title,
        courseId: lessonLearningItem.lesson.courseId,
        courseCode: lessonLearningItem.lesson.course.code,
        courseTitle: lessonLearningItem.lesson.course.title,
        order: lessonLearningItem.order ?? undefined,
      })),
    }
  }
}
