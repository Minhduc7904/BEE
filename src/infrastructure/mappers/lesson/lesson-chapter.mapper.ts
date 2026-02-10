import { LessonChapter } from "src/domain/entities";
import { ChapterMapper } from "../subject/chapter.mapper";

export class LessonChapterMapper {
    static toDomain(raw: any): LessonChapter {
        return new LessonChapter({
            lessonId: raw.lessonId,
            chapterId: raw.chapterId,
            chapter: raw.chapter ? ChapterMapper.toDomainChapter(raw.chapter) : undefined,
        });
    }
    static toDomainList(rawList: any[]): LessonChapter[] {
        return rawList.map((raw) => this.toDomain(raw));
    }
}