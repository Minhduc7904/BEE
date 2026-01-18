import { LessonChapter } from "src/domain/entities";

export class LessonChapterMapper {
    static toDomain(raw: any): LessonChapter {
        return new LessonChapter({
            lessonId: raw.lessonId,
            chapterId: raw.chapterId,
        });
    }
    static toDomainList(rawList: any[]): LessonChapter[] {
        return rawList.map((raw) => this.toDomain(raw));
    }
}