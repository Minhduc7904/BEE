import type { IDocumentRepository } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export async function generateUniqueDocumentSlug(
  title: string,
  documentRepository: Pick<IDocumentRepository, 'findBySlug'>,
  currentDocumentId?: number,
  currentSlug?: string,
): Promise<string> {
  const baseSlug = TextSearchUtil.generateSlug(title, null)
  const safeBaseSlug = baseSlug || (currentDocumentId ? `document-${currentDocumentId}` : 'document')

  let candidate = safeBaseSlug
  let counter = 2

  while (true) {
    if (candidate === currentSlug) {
      return candidate
    }

    const existing = await documentRepository.findBySlug(candidate)
    if (!existing || existing.documentId === currentDocumentId) {
      return candidate
    }

    candidate = `${safeBaseSlug}-${counter++}`
  }
}
