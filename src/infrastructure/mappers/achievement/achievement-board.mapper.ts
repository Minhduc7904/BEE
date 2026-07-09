import { AchievementBoardEntity, AchievementRowEntity } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'

export class AchievementBoardMapper {
  static toDomain(prismaBoard: any): AchievementBoardEntity {
    return new AchievementBoardEntity({
      achievementBoardId: prismaBoard.achievementBoardId,
      title: prismaBoard.title,
      slug: prismaBoard.slug,
      competitionName: prismaBoard.competitionName,
      academicYear: prismaBoard.academicYear ?? null,
      description: prismaBoard.description ?? null,
      shortDescription: prismaBoard.shortDescription ?? null,
      targetKeyword: prismaBoard.targetKeyword ?? null,
      keywordText: prismaBoard.keywordText ?? null,
      metaTitle: prismaBoard.metaTitle ?? null,
      metaDescription: prismaBoard.metaDescription ?? null,
      ogTitle: prismaBoard.ogTitle ?? null,
      ogDescription: prismaBoard.ogDescription ?? null,
      searchIntent: prismaBoard.searchIntent ?? null,
      seoScore: prismaBoard.seoScore ?? null,
      visibility: prismaBoard.visibility as Visibility,
      isFeatured: prismaBoard.isFeatured ?? false,
      viewCount: prismaBoard.viewCount ?? 0,
      sortOrder: prismaBoard.sortOrder ?? 0,
      createdBy: prismaBoard.createdBy ?? null,
      updatedBy: prismaBoard.updatedBy ?? null,
      createdAt: prismaBoard.createdAt,
      updatedAt: prismaBoard.updatedAt,
      rows: this.toDomainRows(prismaBoard.rows),
    })
  }

  static toDomainList(prismaBoards: any[]): AchievementBoardEntity[] {
    return prismaBoards.map((board) => this.toDomain(board))
  }

  static toDomainRow(prismaRow: any): AchievementRowEntity {
    return new AchievementRowEntity({
      achievementRowId: prismaRow.achievementRowId,
      achievementBoardId: prismaRow.achievementBoardId,
      studentName: prismaRow.studentName,
      schoolName: prismaRow.schoolName ?? null,
      grade: prismaRow.grade ?? null,
      score: prismaRow.score === null || prismaRow.score === undefined ? null : Number(prismaRow.score),
      sortOrder: prismaRow.sortOrder ?? 0,
      createdAt: prismaRow.createdAt,
      updatedAt: prismaRow.updatedAt,
    })
  }

  static toDomainRows(prismaRows?: any[] | null): AchievementRowEntity[] {
    if (!prismaRows?.length) return []
    return prismaRows.map((row) => this.toDomainRow(row))
  }
}
