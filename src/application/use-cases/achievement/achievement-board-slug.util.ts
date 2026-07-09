import type { IAchievementBoardRepository } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export async function generateUniqueAchievementBoardSlug(
  title: string,
  achievementBoardRepository: Pick<IAchievementBoardRepository, 'findBySlug'>,
  currentAchievementBoardId?: number,
  currentSlug?: string,
): Promise<string> {
  const baseSlug = TextSearchUtil.generateSlug(title, null)
  const safeBaseSlug = baseSlug || (
    currentAchievementBoardId ? `achievement-board-${currentAchievementBoardId}` : 'achievement-board'
  )

  let candidate = safeBaseSlug
  let counter = 2

  while (true) {
    if (candidate === currentSlug) {
      return candidate
    }

    const existing = await achievementBoardRepository.findBySlug(candidate, false)
    if (!existing || existing.achievementBoardId === currentAchievementBoardId) {
      return candidate
    }

    candidate = `${safeBaseSlug}-${counter++}`
  }
}
