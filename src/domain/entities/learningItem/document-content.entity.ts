// src/domain/entities/learningItem/document-content.entity.ts

import { LearningItem } from './learning-item.entity'

export class DocumentContent {
    // Required properties
    documentContentId: number
    learningItemId: number
    content: string
    createdAt: Date
    updatedAt: Date

    // Optional properties
    orderInDocument?: number | null

    // Navigation properties
    learningItem?: LearningItem

    constructor(data: {
        documentContentId: number
        learningItemId: number
        content: string
        createdAt?: Date
        updatedAt?: Date
        orderInDocument?: number | null
        learningItem?: LearningItem
    }) {
        this.documentContentId = data.documentContentId
        this.learningItemId = data.learningItemId
        this.content = data.content
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()
        this.orderInDocument = data.orderInDocument
        this.learningItem = data.learningItem
    }

    /* ===================== DOMAIN METHODS ===================== */

    hasOrder(): boolean {
        return this.orderInDocument !== null && this.orderInDocument !== undefined
    }

    /**
     * So sánh thứ tự hiển thị trong cùng 1 document
     */
    compareOrder(other: DocumentContent): number {
        const a = this.orderInDocument ?? Number.MAX_SAFE_INTEGER
        const b = other.orderInDocument ?? Number.MAX_SAFE_INTEGER
        return a - b
    }

    /**
     * Cập nhật nội dung tài liệu
     */
    updateContent(content: string): void {
        this.content = content
        this.updatedAt = new Date()
    }

    equals(other: DocumentContent): boolean {
        return this.documentContentId === other.documentContentId
    }

    toJSON() {
        return {
            documentContentId: this.documentContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            orderInDocument: this.orderInDocument,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): DocumentContent {
        return new DocumentContent({
            documentContentId: this.documentContentId,
            learningItemId: this.learningItemId,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            orderInDocument: this.orderInDocument,
            learningItem: this.learningItem,
        })
    }
}
