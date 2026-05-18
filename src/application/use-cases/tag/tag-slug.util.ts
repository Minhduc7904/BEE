import type { ITagRepository } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export async function generateUniqueTagSlug(
  name: string,
  tagRepository: Pick<ITagRepository, 'findBySlug'>,
  currentTagId?: number,
  currentSlug?: string,
): Promise<string> {
  const baseSlug = TextSearchUtil.generateSlug(name, null)
  const safeBaseSlug = baseSlug || (currentTagId ? `tag-${currentTagId}` : 'tag')

  let candidate = safeBaseSlug
  let counter = 2

  while (true) {
    if (candidate === currentSlug) {
      return candidate
    }

    const existing = await tagRepository.findBySlug(candidate)
    if (!existing || existing.tagId === currentTagId) {
      return candidate
    }

    candidate = `${safeBaseSlug}-${counter++}`
  }
}
