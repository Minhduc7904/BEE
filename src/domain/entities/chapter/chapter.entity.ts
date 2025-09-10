// src/domain/entities/chapter/chapter.entity.ts
import { SubjectEntity } from '../subject/subject.entity';

export class ChapterEntity {
    chapterId: number;
    subjectId: number;
    name: string;
    slug: string;
    parentChapterId?: number | null;
    orderInParent: number;
    level: number;

    // Relations (optional - sẽ được populate khi cần)
    subject?: SubjectEntity;
    parent?: ChapterEntity | null;
    children?: ChapterEntity[];

    constructor(data: {
        chapterId: number;
        subjectId: number;
        name: string;
        slug: string;
        parentChapterId?: number | null;
        orderInParent: number;
        level: number;
        subject?: SubjectEntity;
        parent?: ChapterEntity | null;
        children?: ChapterEntity[];
    }) {
        this.chapterId = data.chapterId;
        this.subjectId = data.subjectId;
        this.name = data.name;
        this.slug = data.slug;
        this.parentChapterId = data.parentChapterId;
        this.orderInParent = data.orderInParent;
        this.level = data.level;
        this.subject = data.subject;
        this.parent = data.parent;
        this.children = data.children;
    }

    /**
     * Kiểm tra xem đây có phải chapter gốc (root) không
     */
    isRoot(): boolean {
        return this.parentChapterId === null;
    }

    /**
     * Kiểm tra xem chapter có children không
     */
    hasChildren(): boolean {
        return Boolean(this.children && this.children.length > 0);
    }

    /**
     * Lấy tất cả children theo thứ tự orderInParent
     */
    getOrderedChildren(): ChapterEntity[] {
        if (!this.children) return [];
        return this.children.sort((a, b) => a.orderInParent - b.orderInParent);
    }

    /**
     * Lấy đường dẫn đầy đủ từ root đến chapter hiện tại
     * Ví dụ: "VECTƠ / Tích vô hướng của hai vectơ"
     */
    getFullPath(): string {
        if (this.isRoot()) {
            return this.name;
        }
        
        if (this.parent) {
            return `${this.parent.getFullPath()} / ${this.name}`;
        }
        
        return this.name;
    }

    /**
     * Lấy cấp độ hiển thị (0 = root, 1 = con của root, ...)
     */
    getDepthLevel(): number {
        return this.level;
    }

    /**
     * Tạo slug hierarchy cho URL
     * Ví dụ: "10c4/10c45" cho chapter con
     */
    getHierarchicalSlug(): string {
        if (this.isRoot()) {
            return this.slug;
        }
        
        if (this.parent) {
            return `${this.parent.getHierarchicalSlug()}/${this.slug}`;
        }
        
        return this.slug;
    }

    /**
     * Kiểm tra xem chapter hiện tại có phải ancestor của chapter khác không
     */
    isAncestorOf(chapter: ChapterEntity): boolean {
        let current = chapter.parent;
        while (current) {
            if (current.chapterId === this.chapterId) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    /**
     * Kiểm tra xem chapter hiện tại có phải descendant của chapter khác không
     */
    isDescendantOf(chapter: ChapterEntity): boolean {
        return chapter.isAncestorOf(this);
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
    getSubjectName(): string | undefined {
        return this.subject?.name;
    }

    /**
     * Lấy mã môn học
     */
    getSubjectCode(): string | undefined {
        return this.subject?.getSubjectCode();
    }

    /**
     * Kiểm tra xem chapter có thuộc môn học cụ thể không
     */
    belongsToSubject(subjectId: number): boolean {
        return this.subjectId === subjectId;
    }

    /**
     * Lấy grade từ slug pattern (ví dụ: "10c1" -> 10)
     */
    getGradeFromSlug(): number | null {
        const match = this.slug.match(/^(\d+)c/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Kiểm tra xem có phải chapter của lớp cụ thể không
     */
    isForGrade(grade: number): boolean {
        const chapterGrade = this.getGradeFromSlug();
        return chapterGrade === grade;
    }

    /**
     * Lấy tất cả siblings (anh chị em cùng cha)
     */
    getSiblings(): ChapterEntity[] {
        if (!this.parent || !this.parent.children) {
            return [];
        }
        
        return this.parent.children.filter(child => child.chapterId !== this.chapterId);
    }

    /**
     * Lấy chapter trước đó trong cùng level
     */
    getPreviousSibling(): ChapterEntity | null {
        const siblings = this.getSiblings();
        if (siblings.length === 0) return null;
        
        const sortedSiblings = siblings
            .filter(s => s.orderInParent < this.orderInParent)
            .sort((a, b) => b.orderInParent - a.orderInParent);
            
        return sortedSiblings[0] || null;
    }

    /**
     * Lấy chapter tiếp theo trong cùng level
     */
    getNextSibling(): ChapterEntity | null {
        const siblings = this.getSiblings();
        if (siblings.length === 0) return null;
        
        const sortedSiblings = siblings
            .filter(s => s.orderInParent > this.orderInParent)
            .sort((a, b) => a.orderInParent - b.orderInParent);
            
        return sortedSiblings[0] || null;
    }

    /**
     * Serialize để gửi qua API
     */
    toJSON() {
        return {
            chapterId: this.chapterId,
            subjectId: this.subjectId,
            name: this.name,
            slug: this.slug,
            parentChapterId: this.parentChapterId,
            orderInParent: this.orderInParent,
            level: this.level,
            isRoot: this.isRoot(),
            hasChildren: this.hasChildren(),
            fullPath: this.getFullPath(),
            hierarchicalSlug: this.getHierarchicalSlug(),
            // Không include relations để tránh circular reference
            subject: this.subject ? this.subject.toJSON() : undefined,
        };
    }

    /**
     * Tạo entity từ Prisma model data
     */
    static fromPrisma(data: any): ChapterEntity {
        return new ChapterEntity({
            chapterId: data.chapterId,
            subjectId: data.subjectId,
            name: data.name,
            slug: data.slug,
            parentChapterId: data.parentChapterId,
            orderInParent: data.orderInParent,
            level: data.level,
            subject: data.subject ? SubjectEntity.fromPrisma(data.subject) : undefined,
            parent: data.parent ? ChapterEntity.fromPrisma(data.parent) : null,
            children: data.children ? data.children.map((child: any) => ChapterEntity.fromPrisma(child)) : undefined,
        });
    }

    /**
     * Tạo hierarchy tree từ danh sách chapters phẳng
     */
    static buildHierarchy(chapters: ChapterEntity[]): ChapterEntity[] {
        const chapterMap = new Map<number, ChapterEntity>();
        const rootChapters: ChapterEntity[] = [];

        // Tạo map để tra cứu nhanh
        chapters.forEach(chapter => {
            chapterMap.set(chapter.chapterId, chapter);
        });

        // Xây dựng cây hierarchy
        chapters.forEach(chapter => {
            if (chapter.parentChapterId) {
                const parent = chapterMap.get(chapter.parentChapterId);
                if (parent) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push(chapter);
                    chapter.parent = parent;
                }
            } else {
                rootChapters.push(chapter);
            }
        });

        // Sắp xếp children theo orderInParent
        chapters.forEach(chapter => {
            if (chapter.children) {
                chapter.children.sort((a, b) => a.orderInParent - b.orderInParent);
            }
        });

        // Sắp xếp root chapters theo orderInParent
        return rootChapters.sort((a, b) => a.orderInParent - b.orderInParent);
    }
}
