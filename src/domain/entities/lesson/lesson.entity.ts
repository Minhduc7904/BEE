// src/domain/entities/lesson/lesson.entity.ts

import { Visibility } from '../../../shared/enums'
import { Course } from '../course/course.entity'
import { Admin } from '../user/admin.entity'
import { LessonLearningItem } from './lesson-learning-item.entity'
import { LessonChapter } from './lesson-chapter.entity'

export class Lesson {
  // Required properties
  lessonId: number
  courseId: number
  title: string
  visibility: Visibility
  orderInCourse: number
  allowTrial: boolean
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  teacherId?: number | null

  // Navigation properties
  course?: Course
  teacher?: Admin | null
  learningItems?: LessonLearningItem[]
  lessonChapters?: LessonChapter[]

  constructor(data: {
    lessonId: number,
    courseId: number,
    title: string,
    visibility: Visibility,
    orderInCourse: number,
    allowTrial: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    description?: string | null,
    teacherId?: number | null,
    course?: Course,
    teacher?: Admin | null,
    learningItems?: LessonLearningItem[],
    lessonChapters?: LessonChapter[],
  }) {
    this.lessonId = data.lessonId
    this.courseId = data.courseId
    this.title = data.title
    this.visibility = data.visibility
    this.orderInCourse = data.orderInCourse
    this.allowTrial = data.allowTrial
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()

    this.description = data.description
    this.teacherId = data.teacherId
    this.course = data.course
    this.teacher = data.teacher
    this.learningItems = data.learningItems
    this.lessonChapters = data.lessonChapters
  }

  /* ===================== BUSINESS METHODS ===================== */

  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  hasTeacher(): boolean {
    return this.teacherId !== null && this.teacherId !== undefined
  }

  isDraft(): boolean {
    return this.visibility === Visibility.DRAFT
  }

  isPublished(): boolean {
    return this.visibility === Visibility.PUBLISHED
  }

  isPrivate(): boolean {
    return this.visibility === Visibility.PRIVATE
  }

  isTrialAllowed(): boolean {
    return this.allowTrial === true
  }

  hasLearningItems(): boolean {
    return (this.learningItems?.length ?? 0) > 0
  }

  getLearningItemsCount(): number {
    return this.learningItems?.length ?? 0
  }

  hasChapters(): boolean {
    return (this.lessonChapters?.length ?? 0) > 0
  }

  getTeacherName(): string | null {
    if (!this.teacher?.user) return null
    const { firstName, lastName } = this.teacher.user
    return `${firstName ?? ''} ${lastName ?? ''}`.trim() || null
  }

  /**
   * Kiểm tra lesson có thể hiển thị cho học sinh không
   */
  canBeViewedByStudent(): boolean {
    return this.isPublished() || this.isTrialAllowed()
  }

  equals(other: Lesson): boolean {
    return this.lessonId === other.lessonId
  }

  toJSON() {
    return {
      lessonId: this.lessonId,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      visibility: this.visibility,
      orderInCourse: this.orderInCourse,
      allowTrial: this.allowTrial,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  clone(): Lesson {
    return new Lesson({
      lessonId: this.lessonId,
      courseId: this.courseId,
      title: this.title,
      visibility: this.visibility,
      orderInCourse: this.orderInCourse,
      allowTrial: this.allowTrial,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      description: this.description,
      teacherId: this.teacherId,
      course: this.course,
      teacher: this.teacher,
      learningItems: this.learningItems,
      lessonChapters: this.lessonChapters,
    })
  }
}
