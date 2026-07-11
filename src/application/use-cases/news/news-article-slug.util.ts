import type { INewsArticleRepository } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export async function generateUniqueNewsArticleSlug(
  title: string,
  newsArticleRepository: Pick<INewsArticleRepository, 'findBySlug'>,
  currentNewsArticleId?: number,
  currentSlug?: string,
): Promise<string> {
  const baseSlug = TextSearchUtil.generateSlug(title, null)
  const safeBaseSlug = baseSlug || (currentNewsArticleId ? `news-article-${currentNewsArticleId}` : 'news-article')
  let candidate = safeBaseSlug
  let counter = 2

  while (true) {
    if (candidate === currentSlug) return candidate

    const existing = await newsArticleRepository.findBySlug(candidate)
    if (!existing || existing.newsArticleId === currentNewsArticleId) return candidate

    candidate = `${safeBaseSlug}-${counter++}`
  }
}
