import type { ITeacherProfileRepository } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export async function generateUniqueTeacherProfileSlug(
  displayName: string,
  teacherProfileRepository: Pick<ITeacherProfileRepository, 'findBySlug'>,
  currentTeacherProfileId?: number,
  currentSlug?: string,
): Promise<string> {
  const baseSlug = TextSearchUtil.generateSlug(displayName, null)
  const safeBaseSlug = baseSlug || (
    currentTeacherProfileId ? `teacher-profile-${currentTeacherProfileId}` : 'teacher-profile'
  )

  let candidate = safeBaseSlug
  let counter = 2

  while (true) {
    if (candidate === currentSlug) {
      return candidate
    }

    const existing = await teacherProfileRepository.findBySlug(candidate)
    if (!existing || existing.teacherProfileId === currentTeacherProfileId) {
      return candidate
    }

    candidate = `${safeBaseSlug}-${counter++}`
  }
}
