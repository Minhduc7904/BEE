import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { ValidationException } from 'src/shared/exceptions/custom-exceptions'

export async function assertTagIdsExist(repos: UnitOfWorkRepos, tagIds?: number[]): Promise<void> {
  if (!tagIds || tagIds.length === 0) return

  const uniqueTagIds = Array.from(new Set(tagIds))
  const tags = await repos.tagRepository.findManyByIds(uniqueTagIds)

  if (tags.length !== uniqueTagIds.length) {
    const foundIds = new Set(tags.map((tag) => tag.tagId))
    const missingIds = uniqueTagIds.filter((tagId) => !foundIds.has(tagId))
    throw new ValidationException(`Tag khong ton tai: ${missingIds.join(', ')}`)
  }
}
