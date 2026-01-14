// src/domain/entities/lesson/lesson.entity.ts
import { Course } from '../course/course.entity'
import { Admin } from '../user/admin.entity'
import { LessonLearningItem } from './lesson-learning-item.entity'

export class Lesson {
  // Required properties
  lessonId: number
  courseId: number
  title: string
  createdAt: Date
  updatedAt: Date

  // Optional properties
  description?: string | null
  teacherId?: number | null

  // Relations (optional - sẽ được populate khi cần)
  course?: Course
  teacher?: Admin | null
  learningItems?: LessonLearningItem[]

  constructor(data: {
    lessonId: number
    courseId: number
    title: string
    createdAt: Date
    updatedAt: Date
    description?: string | null
    teacherId?: number | null
    course?: Course
    teacher?: Admin | null
    learningItems?: LessonLearningItem[]
  }) {
    this.lessonId = data.lessonId
    this.courseId = data.courseId
    this.title = data.title
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.description = data.description
    this.teacherId = data.teacherId
    this.course = data.course
    this.teacher = data.teacher
    this.learningItems = data.learningItems
  }

  /**
   * Kiểm tra lesson có description không
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0)
  }

  /**
   * Kiểm tra lesson có teacher không
   */
  hasTeacher(): boolean {
    return this.teacherId !== null && this.teacherId !== undefined
  }

  /**
   * Kiểm tra lesson có learning items không
   */
  hasLearningItems(): boolean {
    return Boolean(this.learningItems && this.learningItems.length > 0)
  }

  /**
   * Lấy số lượng learning items
   */
  getLearningItemsCount(): number {
    return this.learningItems?.length ?? 0
  }

  /**
   * Lấy teacher name (nếu có)
   */
  getTeacherName(): string | null {
    if (!this.teacher) return null
    return `${this.teacher.user?.firstName ?? ''} ${this.teacher.user?.lastName ?? ''}`.trim()
  }

  /**
   * Tạo plain object từ entity
   */
  toJSON() {
    return {
      lessonId: this.lessonId,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      course: this.course,
      teacher: this.teacher,
      learningItems: this.learningItems,
    }
  }

  /**
   * So sánh 2 lessons theo lessonId
   */
  equals(other: Lesson): boolean {
    return this.lessonId === other.lessonId
  }

  /**
   * Clone lesson entity
   */
  clone(): Lesson {
    return new Lesson({
      lessonId: this.lessonId,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      teacherId: this.teacherId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      course: this.course,
      teacher: this.teacher,
      learningItems: this.learningItems,
    })
  }
}
