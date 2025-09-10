import { StorageProvider } from '../../../shared/enums/storage-provider.enum';
import { SubjectEntity } from '../subject/subject.entity';
import { Admin } from '../user/admin.entity';

export class Document {
    documentId: number;
    adminId?: number | null;
    description?: string | null;
    url: string;
    anotherUrl?: string | null;
    mimeType?: string | null;
    subjectId?: number | null;
    relatedType?: string | null;
    relatedId?: number | null;
    storageProvider: StorageProvider;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional - sẽ được populate khi cần)
    subject?: SubjectEntity;
    admin?: Admin; // AdminEntity - avoid circular dependency

    constructor(data: {
        documentId: number;
        url: string;
        storageProvider: StorageProvider;
        createdAt: Date;
        updatedAt: Date;
        adminId?: number | null;
        description?: string | null;
        anotherUrl?: string | null;
        mimeType?: string | null;
        subjectId?: number | null;
        relatedType?: string | null;
        relatedId?: number | null;
        subject?: SubjectEntity;
        admin?: Admin;
    }) {
        this.documentId = data.documentId;
        this.adminId = data.adminId;
        this.description = data.description;
        this.url = data.url;
        this.anotherUrl = data.anotherUrl;
        this.mimeType = data.mimeType;
        this.subjectId = data.subjectId;
        this.relatedType = data.relatedType;
        this.relatedId = data.relatedId;
        this.storageProvider = data.storageProvider;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.subject = data.subject;
        this.admin = data.admin;
    }

    /**
     * Kiểm tra document có mô tả không
     */
    hasDescription(): boolean {
        return Boolean(this.description && this.description.trim().length > 0);
    }

    /**
     * Lấy mô tả hoặc text mặc định
     */
    getDescriptionDisplay(): string {
        return this.description || 'Không có mô tả';
    }

    /**
     * Kiểm tra document có được gán môn học không
     */
    hasSubject(): boolean {
        return !!this.subjectId;
    }

    /**
     * Lấy thông tin môn học
     */
    getSubject(): SubjectEntity | undefined {
        return this.subject;
    }

    /**
     * Lấy tên môn học
     */
    getSubjectName(): string {
        return this.subject?.name || 'Chưa xác định môn học';
    }

    /**
     * Lấy mã môn học
     */
    getSubjectCode(): string {
        return this.subject?.getSubjectCode() || 'N/A';
    }

    /**
     * Hiển thị thông tin môn học đầy đủ
     */
    getSubjectDisplay(): string {
        if (!this.subject) {
            return 'Chưa được gán môn học';
        }
        return this.subject.getFullName();
    }

    /**
     * Kiểm tra document có thuộc môn học cụ thể không
     */
    belongsToSubject(subjectId: number): boolean {
        return this.subjectId === subjectId;
    }

    /**
     * Kiểm tra document có liên quan đến entity cụ thể không
     */
    isRelatedTo(type: string, id: number): boolean {
        return this.relatedType === type && this.relatedId === id;
    }

    /**
     * Kiểm tra có URL phụ không
     */
    hasAlternativeUrl(): boolean {
        return Boolean(this.anotherUrl && this.anotherUrl.trim().length > 0);
    }

    /**
     * Lấy MIME type hiển thị
     */
    getMimeTypeDisplay(): string {
        return this.mimeType || 'Không xác định';
    }

    /**
     * Kiểm tra có phải file ảnh không
     */
    isImage(): boolean {
        return this.mimeType?.startsWith('image/') || false;
    }

    /**
     * Kiểm tra có phải file PDF không
     */
    isPdf(): boolean {
        return this.mimeType === 'application/pdf';
    }

    /**
     * Kiểm tra có phải file video không
     */
    isVideo(): boolean {
        return this.mimeType?.startsWith('video/') || false;
    }

    /**
     * Kiểm tra có phải file audio không
     */
    isAudio(): boolean {
        return this.mimeType?.startsWith('audio/') || false;
    }

    /**
     * Lấy tên file từ URL
     */
    getFileName(): string {
        try {
            const url = new URL(this.url);
            const pathname = url.pathname;
            return pathname.split('/').pop() || 'unknown';
        } catch {
            return this.url.split('/').pop() || 'unknown';
        }
    }

    /**
     * Lấy phần mở rộng file
     */
    getFileExtension(): string {
        const fileName = this.getFileName();
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
    }

    /**
     * Kiểm tra có phải storage provider external không
     */
    isExternalStorage(): boolean {
        return this.storageProvider === StorageProvider.EXTERNAL;
    }

    /**
     * Kiểm tra có phải storage provider local không
     */
    isLocalStorage(): boolean {
        return this.storageProvider === StorageProvider.LOCAL;
    }

    /**
     * Lấy thông tin admin tạo document
     */
    getAdmin(): Admin | undefined {
        return this.admin;
    }

    /**
     * Kiểm tra document có được tạo bởi admin cụ thể không
     */
    isCreatedByAdmin(adminId: number): boolean {
        return this.adminId === adminId;
    }

    /**
     * Serialize để gửi qua API
     */
    toJSON() {
        return {
            documentId: this.documentId,
            adminId: this.adminId,
            description: this.description,
            url: this.url,
            anotherUrl: this.anotherUrl,
            mimeType: this.mimeType,
            subjectId: this.subjectId,
            relatedType: this.relatedType,
            relatedId: this.relatedId,
            storageProvider: this.storageProvider,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            // Computed fields
            hasDescription: this.hasDescription(),
            hasSubject: this.hasSubject(),
            subjectName: this.getSubjectName(),
            subjectCode: this.getSubjectCode(),
            subjectDisplay: this.getSubjectDisplay(),
            hasAlternativeUrl: this.hasAlternativeUrl(),
            fileName: this.getFileName(),
            fileExtension: this.getFileExtension(),
            isImage: this.isImage(),
            isPdf: this.isPdf(),
            isVideo: this.isVideo(),
            isAudio: this.isAudio(),
            isExternalStorage: this.isExternalStorage(),
            isLocalStorage: this.isLocalStorage(),
            // Relations
            subject: this.subject ? this.subject.toJSON() : undefined,
            admin: this.admin ? {
                adminId: this.admin.adminId,
                userId: this.admin.userId,
                fullName: this.admin.getFullName ? this.admin.getFullName() : undefined,
            } : undefined,
        };
    }

    /**
     * Tạo entity từ Prisma model data
     */
    static fromPrisma(data: any): Document {
        return new Document({
            documentId: data.documentId,
            adminId: data.adminId,
            description: data.description,
            url: data.url,
            anotherUrl: data.anotherUrl,
            mimeType: data.mimeType,
            subjectId: data.subjectId,
            relatedType: data.relatedType,
            relatedId: data.relatedId,
            storageProvider: data.storageProvider,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            subject: data.subject ? SubjectEntity.fromPrisma(data.subject) : undefined,
            admin: data.admin ? Admin.fromPrisma(data.admin) : undefined,
        });
    }

    /**
     * Tạo document cơ bản
     */
    static createBasic(
        documentId: number,
        url: string,
        storageProvider: StorageProvider = StorageProvider.EXTERNAL
    ): Document {
        return new Document({
            documentId,
            url,
            storageProvider,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * So sánh hai document entities
     */
    equals(other: Document): boolean {
        return this.documentId === other.documentId;
    }
}