// src/domain/entities/learningItem/video-content.entity.ts

import { LearningItem } from './learning-item.entity'

export class VideoContent {
    // Required properties
    videoContentId: number
    learningItemId: number
    content: string
    createdAt: Date
    updatedAt: Date

    // Navigation properties
    learningItem?: LearningItem

    constructor(data: {
        videoContentId: number
        learningItemId: number
        content: string
        createdAt?: Date
        updatedAt?: Date
        learningItem?: LearningItem
    }) {
        this.videoContentId = data.videoContentId
        this.learningItemId = data.learningItemId
        this.content = data.content
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        this.learningItem = data.learningItem
    }

    /* ===================== DOMAIN METHODS ===================== */

    hasDescription(): boolean {
        return Boolean(this.content && this.content.trim().length > 0)
    }

    /**
     * Cập nhật mô tả video
     */
    updateContent(content: string): void {
        this.content = content
        this.updatedAt = new Date()
    }

    equals(other: VideoContent): boolean {
        return this.videoContentId === other.videoContentId
    }

    toJSON() {
        return {
            videoContentId: this.videoContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): VideoContent {
        return new VideoContent({
            videoContentId: this.videoContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            learningItem: this.learningItem,
        })
    }
}
