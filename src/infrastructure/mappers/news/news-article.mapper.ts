import { NewsArticleEntity, NewsArticleJson } from 'src/domain/entities'
import { NewsArticleType, Visibility } from 'src/shared/enums'

export class NewsArticleMapper {
  static toDomain(prismaNewsArticle: any): NewsArticleEntity {
    return new NewsArticleEntity({
      newsArticleId: prismaNewsArticle.newsArticleId,
      type: prismaNewsArticle.type as NewsArticleType,
      title: prismaNewsArticle.title,
      slug: prismaNewsArticle.slug,
      excerpt: prismaNewsArticle.excerpt ?? null,
      contentJson: (prismaNewsArticle.contentJson as NewsArticleJson | null) ?? null,
      contentHtml: prismaNewsArticle.contentHtml ?? null,
      contentText: prismaNewsArticle.contentText ?? null,
      authorName: prismaNewsArticle.authorName ?? null,
      publishedAt: prismaNewsArticle.publishedAt ?? null,
      targetKeyword: prismaNewsArticle.targetKeyword ?? null,
      keywordText: prismaNewsArticle.keywordText ?? null,
      metaTitle: prismaNewsArticle.metaTitle ?? null,
      metaDescription: prismaNewsArticle.metaDescription ?? null,
      ogTitle: prismaNewsArticle.ogTitle ?? null,
      ogDescription: prismaNewsArticle.ogDescription ?? null,
      canonicalUrl: prismaNewsArticle.canonicalUrl ?? null,
      searchIntent: prismaNewsArticle.searchIntent ?? null,
      seoScore: prismaNewsArticle.seoScore ?? null,
      structuredData: (prismaNewsArticle.structuredData as NewsArticleJson | null) ?? null,
      visibility: prismaNewsArticle.visibility as Visibility,
      isFeatured: prismaNewsArticle.isFeatured ?? false,
      viewCount: prismaNewsArticle.viewCount ?? 0,
      readingTime: prismaNewsArticle.readingTime ?? null,
      sortOrder: prismaNewsArticle.sortOrder ?? 0,
      createdBy: prismaNewsArticle.createdBy ?? null,
      updatedBy: prismaNewsArticle.updatedBy ?? null,
      createdAt: prismaNewsArticle.createdAt,
      updatedAt: prismaNewsArticle.updatedAt,
    })
  }

  static toDomainList(prismaNewsArticles: any[]): NewsArticleEntity[] {
    return prismaNewsArticles.map((newsArticle) => this.toDomain(newsArticle))
  }
}
