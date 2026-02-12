// src/application/dtos/lesson/student-lesson.dto.ts
import { Lesson } from '../../../domain/entities'
import { StudentLearningItem } from '../../../domain/entities'
import { Visibility } from '../../../shared/enums'
import { ChapterResponseDto } from '../chapter/chapter.dto'

export class StudentLearningItemProgressDto {
    learningItemId: number
    learningItemName: string
    type: string
    order?: number
    
    // Student progress
    isLearned: boolean
    learnedAt?: Date
}

export class StudentLessonResponseDto {
    lessonId: number
    courseId: number
    courseName?: string
    title: string
    description?: string
    visibility: Visibility
    orderInCourse: number
    teacherId?: number
    teacherName?: string
    allowTrial: boolean
    createdAt: Date
    updatedAt: Date

    // Relations
    chapters?: ChapterResponseDto[]
    learningItems: StudentLearningItemProgressDto[]
    
    // Progress statistics
    totalLearningItems: number
    completedLearningItems: number
    completionPercentage: number

    // Computed fields
    hasDescription?: boolean
    hasTeacher?: boolean
    isDraft?: boolean
    isPublished?: boolean

    static fromEntity(
        lesson: Lesson,
        studentLearningItems: Map<number, StudentLearningItem>
    ): StudentLessonResponseDto {
        // Map learning items với student progress
        const learningItemsWithProgress: StudentLearningItemProgressDto[] = 
            lesson.learningItems?.map(li => {
                const studentProgress = studentLearningItems.get(li.learningItem?.learningItemId ?? 0)
                
                return {
                    learningItemId: li.learningItem?.learningItemId ?? 0,
                    learningItemName: li.learningItem?.title ?? '',
                    type: li.learningItem?.type ?? '',
                    order: li.order ?? undefined,
                    isLearned: studentProgress?.isLearned ?? false,
                    learnedAt: studentProgress?.learnedAt ?? undefined,
                }
            }) ?? []

        // Tính thống kê
        const totalLearningItems = learningItemsWithProgress.length
        const completedLearningItems = learningItemsWithProgress.filter(li => li.isLearned).length
        const completionPercentage = totalLearningItems > 0 
            ? Math.round((completedLearningItems / totalLearningItems) * 100) 
            : 0

        return {
            lessonId: lesson.lessonId,
            courseId: lesson.courseId,
            courseName: lesson.course?.title,
            title: lesson.title,
            description: lesson.description ?? undefined,
            visibility: lesson.visibility,
            orderInCourse: lesson.orderInCourse,
            teacherId: lesson.teacherId ?? undefined,
            teacherName: lesson.teacher 
                ? `${lesson.teacher.user?.firstName} ${lesson.teacher.user?.lastName}` 
                : undefined,
            allowTrial: lesson.allowTrial,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
            chapters: lesson.lessonChapters
                ?.filter(lc => lc.chapter)
                .map(lc => ChapterResponseDto.fromChapter(lc.chapter!)),
            learningItems: learningItemsWithProgress,
            totalLearningItems,
            completedLearningItems,
            completionPercentage,
            hasDescription: lesson.hasDescription(),
            hasTeacher: lesson.hasTeacher(),
            isDraft: lesson.isDraft(),
            isPublished: lesson.isPublished(),
        }
    }

    static fromEntities(
        lessons: Lesson[],
        studentLearningItems: Map<number, StudentLearningItem>
    ): StudentLessonResponseDto[] {
        return lessons.map(lesson => this.fromEntity(lesson, studentLearningItems))
    }
}
