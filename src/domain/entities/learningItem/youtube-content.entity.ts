// src/domain/entities/learningItem/youtube-content.entity.ts

import { LearningItem } from './learning-item.entity'

export class YoutubeContent {
    // Required properties
    youtubeContentId: number
    learningItemId: number
    youtubeUrl: string
    content: string
    createdAt: Date
    updatedAt: Date

    // Navigation properties
    learningItem?: LearningItem

    constructor(data: {
        youtubeContentId: number
        learningItemId: number
        youtubeUrl: string
        content: string
        createdAt?: Date
        updatedAt?: Date
        learningItem?: LearningItem
    }) {
        this.youtubeContentId = data.youtubeContentId
        this.learningItemId = data.learningItemId
        this.youtubeUrl = data.youtubeUrl
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
     * Kiểm tra URL có phải link YouTube hợp lệ không
     */
    isValidYoutubeUrl(): boolean {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(
            this.youtubeUrl,
        )
    }

    /**
     * Lấy videoId từ URL (nếu parse được)
     */
    getYoutubeVideoId(): string | null {
        const match = this.youtubeUrl.match(
            /(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/,
        )
        return match ? match[1] : null
    }

    /**
     * Cập nhật nội dung mô tả
     */
    updateContent(content: string): void {
        this.content = content
        this.updatedAt = new Date()
    }

    /**
     * Cập nhật link YouTube
     */
    updateYoutubeUrl(url: string): void {
        this.youtubeUrl = url
        this.updatedAt = new Date()
    }

    equals(other: YoutubeContent): boolean {
        return this.youtubeContentId === other.youtubeContentId
    }

    toJSON() {
        return {
            youtubeContentId: this.youtubeContentId,
            learningItemId: this.learningItemId,
            youtubeUrl: this.youtubeUrl,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): YoutubeContent {
        return new YoutubeContent({
            youtubeContentId: this.youtubeContentId,
            learningItemId: this.learningItemId,
            youtubeUrl: this.youtubeUrl,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            learningItem: this.learningItem,
        })
    }
}
