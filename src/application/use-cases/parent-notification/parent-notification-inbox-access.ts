import type { AuthenticatedUser, ParentNotificationInboxRepository } from '../../interfaces'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { requireParentIdentity } from './parent-notification-access'

export async function requireParentInboxAccess(
  identity: AuthenticatedUser,
  inbox: ParentNotificationInboxRepository,
  studentId?: number,
): Promise<{ userId: number; parentId: number }> {
  const parent = requireParentIdentity(identity)
  if (studentId && !(await inbox.isStudentLinked(parent.parentId, studentId))) {
    throw new ForbiddenException('Phụ huynh không quản lý học sinh này')
  }
  return parent
}
