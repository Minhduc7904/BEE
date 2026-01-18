// src/domain/entities/lesson/lesson-chapter.entity.ts

import { Lesson } from './lesson.entity'
import { Chapter } from '../chapter/chapter.entity'

export class LessonChapter {
    // Composite key
    lessonId: number
    chapterId: number

    // Navigation properties
    lesson?: Lesson
    chapter?: Chapter

    constructor(data: {
        lessonId: number
        chapterId: number
        lesson?: Lesson
        chapter?: Chapter
    }) {
        this.lessonId = data.lessonId
        this.chapterId = data.chapterId
        this.lesson = data.lesson
        this.chapter = data.chapter
    }

    /* ===================== DOMAIN METHODS ===================== */

    equals(other: LessonChapter): boolean {
        return (
            this.lessonId === other.lessonId &&
            this.chapterId === other.chapterId
        )
    }

    toJSON() {
        return {
            lessonId: this.lessonId,
            chapterId: this.chapterId,
        }
    }

    clone(): LessonChapter {
        return new LessonChapter({
            lessonId: this.lessonId,
            chapterId: this.chapterId,
            lesson: this.lesson,
            chapter: this.chapter,
        })
    }
}
